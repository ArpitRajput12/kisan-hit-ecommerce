export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: any,
    isOperational: boolean = true,
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string = 'Bad request', errors?: any): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized access'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden - insufficient permissions'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Resource conflict'): ApiError {
    return new ApiError(409, message);
  }

  static unprocessableEntity(
    message: string = 'Validation failed',
    errors?: any
  ): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }
}
