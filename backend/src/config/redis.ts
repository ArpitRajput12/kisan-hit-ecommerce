import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const getRedisConnectionOptions = (): RedisOptions => {
  const isTls = env.REDIS_URL.startsWith('rediss://');

  const baseOptions: RedisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 3000);
      if (env.NODE_ENV === 'test' && times > 3) {
        return null;
      }
      return delay;
    },
  };

  if (isTls) {
    baseOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  return baseOptions;
};

export const getBullConnection = () => {
  try {
    const url = new URL(env.REDIS_URL);
    const isTls = url.protocol === 'rediss:';
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };
  }
};

export const redisClient = new Redis(env.REDIS_URL, getRedisConnectionOptions());

redisClient.on('connect', () => {
  logger.info('🔌 [Redis] Connected to Redis server successfully');
});

redisClient.on('ready', () => {
  logger.info('🚀 [Redis] Client ready for commands');
});

redisClient.on('error', (err) => {
  logger.error(`❌ [Redis] Connection error: ${err.message}`);
});

redisClient.on('close', () => {
  logger.warn('⚠️ [Redis] Connection closed');
});

export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    return true;
  } catch (err: any) {
    logger.warn(`⚠️ [Redis] Could not connect to Redis at ${env.REDIS_URL}: ${err.message}. Operating with in-memory fallback.`);
    return false;
  }
};

export default redisClient;
