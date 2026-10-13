import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export const idempotencyMiddleware = (options: { required?: boolean } = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply idempotency to state-mutating requests (POST, PUT, PATCH, DELETE)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = (
      req.headers['idempotency-key'] || req.headers['x-idempotency-key']
    ) as string | undefined;

    if (!idempotencyKey) {
      if (options.required) {
        return next(
          ApiError.badRequest('Idempotency-Key header is required for this operation')
        );
      }
      return next();
    }

    const userId = req.user?.id;
    if (!userId) {
      // If user is not authenticated yet, we can either skip or require auth
      return next();
    }

    try {
      // Check if existing record exists
      const existing = await prisma.idempotencyRecord.findUnique({
        where: {
          key_userId: {
            key: idempotencyKey,
            userId,
          },
        },
      });

      if (existing) {
        if (existing.expiresAt > new Date()) {
          logger.info(`[Idempotency] Hit for key: ${idempotencyKey}, user: ${userId}`);
          res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
          res.status(existing.statusCode).json(existing.responseBody);
          return;
        } else {
          // Expired, delete the old record
          await prisma.idempotencyRecord.delete({
            where: { id: existing.id },
          });
        }
      }

      // Capture original json method to intercept response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = (body: any): Response => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + env.IDEMPOTENCY_EXPIRY_HOURS);

          // Save idempotency record asynchronously
          prisma.idempotencyRecord
            .create({
              data: {
                key: idempotencyKey,
                userId,
                endpoint: `${req.method} ${req.originalUrl}`,
                statusCode: res.statusCode,
                responseBody: body,
                expiresAt,
              },
            })
            .catch((err) => {
              logger.error(`[Idempotency] Failed to store record: ${err.message}`);
            });
        }

        return originalJson(body);
      };

      res.send = (body: any): Response => {
        return originalSend(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
