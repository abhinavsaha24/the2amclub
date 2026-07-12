import { ApiErrors } from "../constants";

export class BaseError extends Error {
  public code: string;
  public statusCode: number;
  public data?: any;

  constructor(message: string, code: string, statusCode: number = 500, data?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, data?: any) {
    super(message, ApiErrors.VALIDATION_ERROR, 400, data);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = "Unauthorized", data?: any) {
    super(message, ApiErrors.AUTHORIZATION_ERROR, 403, data);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = "Unauthenticated", data?: any) {
    super(message, ApiErrors.UNAUTHENTICATED, 401, data);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = "Resource not found") {
    super(message, ApiErrors.NOT_FOUND, 404);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string = "Database operation failed") {
    super(message, ApiErrors.DATABASE_ERROR, 500);
  }
}

export class StorageError extends BaseError {
  constructor(message: string = "Storage operation failed") {
    super(message, ApiErrors.STORAGE_ERROR, 500);
  }
}

export class BusinessLogicError extends BaseError {
  constructor(message: string) {
    super(message, ApiErrors.INTERNAL_ERROR, 400); // 400 because it's usually bad request in business context
  }
}
