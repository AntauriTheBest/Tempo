import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
