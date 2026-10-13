import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError, ZodIssue } from 'zod';
import { ApiError } from '../utils/apiError';

export interface ObjectValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export type RequestValidationSchema = ZodTypeAny | ObjectValidationSchema;

const isZodType = (schema: RequestValidationSchema): schema is ZodTypeAny => {
  return typeof (schema as any).safeParseAsync === 'function';
};

export const validateRequest = (schema: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (isZodType(schema)) {
        const result = await schema.safeParseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (!result.success) {
          const errors = result.error.issues.map((issue: ZodIssue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));
          return next(ApiError.unprocessableEntity('Validation failed', errors));
        }

        if (result.data) {
          if (result.data.body !== undefined) req.body = result.data.body;
          if (result.data.query !== undefined) req.query = result.data.query;
          if (result.data.params !== undefined) req.params = result.data.params;
        }

        return next();
      }

      const objectSchema = schema as ObjectValidationSchema;
      const errors: Array<{ field: string; message: string }> = [];

      if (objectSchema.params) {
        const result = await objectSchema.params.safeParseAsync(req.params);
        if (!result.success) {
          result.error.issues.forEach((issue: ZodIssue) => {
            errors.push({
              field: `params.${issue.path.join('.')}`,
              message: issue.message,
            });
          });
        } else {
          req.params = result.data as any;
        }
      }

      if (objectSchema.query) {
        const result = await objectSchema.query.safeParseAsync(req.query);
        if (!result.success) {
          result.error.issues.forEach((issue: ZodIssue) => {
            errors.push({
              field: `query.${issue.path.join('.')}`,
              message: issue.message,
            });
          });
        } else {
          req.query = result.data as any;
        }
      }

      if (objectSchema.body) {
        const result = await objectSchema.body.safeParseAsync(req.body);
        if (!result.success) {
          result.error.issues.forEach((issue: ZodIssue) => {
            errors.push({
              field: `body.${issue.path.join('.')}`,
              message: issue.message,
            });
          });
        } else {
          req.body = result.data;
        }
      }

      if (errors.length > 0) {
        return next(ApiError.unprocessableEntity('Validation failed', errors));
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(ApiError.unprocessableEntity('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};
