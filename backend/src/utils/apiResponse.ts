import { Response } from 'express';

export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: any;
}

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;
  public readonly errors?: any;

  constructor(statusCode: number, message: string, data?: T, errors?: any) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (errors !== undefined) {
      this.errors = errors;
    }
  }

  static success<T>(
    res: Response,
    message: string = 'Operation successful',
    data?: T,
    statusCode: number = 200
  ): Response {
    const response = new ApiResponse(statusCode, message, data);
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data?: T
  ): Response {
    const response = new ApiResponse(201, message, data);
    return res.status(201).json(response);
  }

  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errors?: any
  ): Response {
    const response = new ApiResponse(statusCode, message, undefined, errors);
    return res.status(statusCode).json(response);
  }
}
