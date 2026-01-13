// Custom error classes for the application

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ImageProcessingError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'IMAGE_PROCESSING_ERROR', 500);
  }
}

export class PlatformError extends AppError {
  constructor(
    message: string,
    public platform: string,
    public recoverable: boolean = true
  ) {
    super(message, 'PLATFORM_ERROR', 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, public platform?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string,
    public platform: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}
