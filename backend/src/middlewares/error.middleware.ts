import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  // Custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation Error';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Prisma Known Request Error
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        message = `Unique constraint violation. A record with this ${target} already exists.`;
        errors = { target: err.meta?.target };
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = (err.meta?.cause as string) || 'Resource not found in database';
        break;
      }
      case 'P2003': {
        statusCode = 400;
        message = 'Foreign key constraint failed on related entity';
        errors = { field: err.meta?.field_name };
        break;
      }
      default:
        statusCode = 400;
        message = `Database query error (${err.code})`;
        break;
    }
  }
  // Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided to database query';
  }
  // Malformed JSON payload
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }
  // JWT Token Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }
  // Other Errors
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}: ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} (${statusCode}): ${message}`, {
      errors,
    });
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors !== undefined ? { errors } : {}),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
