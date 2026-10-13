import crypto from 'crypto';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// In-memory fallback map for environments without live Redis
interface MemoryCacheItem {
  value: string;
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryCacheItem>();

// In-memory lock map
interface MemoryLockItem {
  token: string;
  expiresAt: number;
}
const memoryLocks = new Map<string, MemoryLockItem>();

// In-memory OTP attempt limiter
interface MemoryOtpItem {
  otp: string;
  attempts: number;
  expiresAt: number;
}
const memoryOtps = new Map<string, MemoryOtpItem>();

export class RedisService {
  private isConnected(): boolean {
    return redisClient.status === 'ready' || redisClient.status === 'connect';
  }

  // ================= GENERAL CACHE =================
  async get(key: string): Promise<string | null> {
    try {
      if (this.isConnected()) {
        return await redisClient.get(key);
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on get: ${err.message}`);
    }

    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.isConnected()) {
        if (ttlSeconds && ttlSeconds > 0) {
          await redisClient.set(key, value, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, value);
        }
        return;
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on set: ${err.message}`);
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected()) {
        await redisClient.del(key);
        return;
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on del: ${err.message}`);
    }

    memoryStore.delete(key);
  }

  // ================= DISTRIBUTED LOCKING (LUA SCRIPT) =================
  /**
   * Acquire a distributed concurrency lock on a given resource key
   * @param resourceKey e.g. "lock:inventory:prod_123"
   * @param ttlMs Lock time-to-live in milliseconds (default 5000ms)
   * @returns lockToken string if successfully acquired, null if already locked
   */
  async acquireLock(resourceKey: string, ttlMs: number = 5000): Promise<string | null> {
    const lockToken = crypto.randomUUID();
    const lockKey = resourceKey.startsWith('lock:') ? resourceKey : `lock:${resourceKey}`;

    try {
      if (this.isConnected()) {
        const result = await redisClient.set(lockKey, lockToken, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return lockToken;
        }
        return null;
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on acquireLock: ${err.message}`);
    }

    // In-memory lock fallback
    const now = Date.now();
    const existing = memoryLocks.get(lockKey);
    if (existing && existing.expiresAt > now) {
      return null; // Already locked
    }

    memoryLocks.set(lockKey, { token: lockToken, expiresAt: now + ttlMs });
    return lockToken;
  }

  /**
   * Release a distributed lock atomically using a Lua script
   * Prevents deleting locks held by other concurrent processes if TTL has elapsed
   */
  async releaseLock(resourceKey: string, lockToken: string): Promise<boolean> {
    const lockKey = resourceKey.startsWith('lock:') ? resourceKey : `lock:${resourceKey}`;

    // Atomic Lua script: delete only if current value matches lockToken
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      if (this.isConnected()) {
        const result = await redisClient.eval(luaScript, 1, lockKey, lockToken);
        return result === 1;
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on releaseLock: ${err.message}`);
    }

    // In-memory fallback
    const existing = memoryLocks.get(lockKey);
    if (existing && existing.token === lockToken) {
      memoryLocks.delete(lockKey);
      return true;
    }
    return false;
  }

  // ================= OTP MANAGEMENT (5-MIN TTL & ATTEMPT LIMITER) =================
  /**
   * Generates a 6-digit OTP and stores it with a 5-minute TTL
   */
  async generateAndStoreOtp(identifier: string, ttlSeconds: number = 300): Promise<string> {
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const otpKey = `otp:${identifier}`;
    const attemptsKey = `otp_attempts:${identifier}`;

    try {
      if (this.isConnected()) {
        await redisClient.set(otpKey, otp, 'EX', ttlSeconds);
        await redisClient.set(attemptsKey, '0', 'EX', ttlSeconds);
        return otp;
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on OTP generation: ${err.message}`);
    }

    memoryOtps.set(identifier, {
      otp,
      attempts: 0,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return otp;
  }

  /**
   * Verifies an OTP, enforcing a maximum of 3 attempts
   */
  async verifyOtp(
    identifier: string,
    providedOtp: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const otpKey = `otp:${identifier}`;
    const attemptsKey = `otp_attempts:${identifier}`;

    try {
      if (this.isConnected()) {
        const storedOtp = await redisClient.get(otpKey);
        if (!storedOtp) {
          return { valid: false, reason: 'OTP has expired or was never requested' };
        }

        const attemptsStr = await redisClient.get(attemptsKey);
        const attempts = parseInt(attemptsStr || '0', 10);

        if (attempts >= 3) {
          // Max attempts exceeded, invalidate OTP
          await redisClient.del(otpKey);
          await redisClient.del(attemptsKey);
          return { valid: false, reason: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' };
        }

        if (storedOtp !== providedOtp.trim()) {
          await redisClient.incr(attemptsKey);
          return { valid: false, reason: `Invalid OTP. Attempts left: ${2 - attempts}` };
        }

        // Successfully verified, clean up
        await redisClient.del(otpKey);
        await redisClient.del(attemptsKey);
        return { valid: true };
      }
    } catch (err: any) {
      logger.warn(`[RedisService] Fallback to in-memory on verifyOtp: ${err.message}`);
    }

    // In-memory fallback
    const item = memoryOtps.get(identifier);
    if (!item || Date.now() > item.expiresAt) {
      memoryOtps.delete(identifier);
      return { valid: false, reason: 'OTP has expired or was never requested' };
    }

    if (item.attempts >= 3) {
      memoryOtps.delete(identifier);
      return { valid: false, reason: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' };
    }

    if (item.otp !== providedOtp.trim()) {
      item.attempts += 1;
      return { valid: false, reason: `Invalid OTP. Attempts left: ${3 - item.attempts}` };
    }

    memoryOtps.delete(identifier);
    return { valid: true };
  }
}

export const redisService = new RedisService();

