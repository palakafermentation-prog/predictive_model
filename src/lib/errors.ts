/**
 * Custom error classes for application-level errors.
 * Every HttpError carries a machine-readable ErrorCode for consistent API responses.
 */

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL = "INTERNAL",
  VALIDATION = "VALIDATION",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCode,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = "Bad Request") {
    super(message, 400, ErrorCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = "Not Found") {
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = "Conflict") {
    super(message, 409, ErrorCode.CONFLICT);
  }
}

export class EmailNotVerifiedError extends HttpError {
  constructor(message: string = "Please verify your email before signing in") {
    super(message, 403, ErrorCode.EMAIL_NOT_VERIFIED);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, 503, ErrorCode.SERVICE_UNAVAILABLE);
  }
}
