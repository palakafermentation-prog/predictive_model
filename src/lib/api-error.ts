import { HttpError, ErrorCode } from "@/lib/errors";
import { ZodError } from "zod/v4";
import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
  requestId?: string;
}

export interface ErrorContext {
  route: string;
  userId?: string;
  requestId?: string;
}

// Detect BetterAuth's APIError (duck-typed — not our HttpError)
function isBetterAuthError(error: unknown): error is { statusCode: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "message" in error &&
    !(error instanceof HttpError)
  );
}

export function handleApiError(error: unknown, context: ErrorContext): NextResponse<ApiErrorBody> {
  const { requestId } = context;

  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors }, requestId },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return NextResponse.json(
      { error: { code: ErrorCode.VALIDATION, message: "Validation failed", fieldErrors }, requestId },
      { status: 400 }
    );
  }

  if (isBetterAuthError(error)) {
    return NextResponse.json(
      { error: { code: ErrorCode.UNAUTHORIZED, message: error.message }, requestId },
      { status: error.statusCode }
    );
  }

  // Unexpected error — log with context for tracing
  console.error(`[${context.route}] Unhandled error`, {
    requestId,
    userId: context.userId,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  });

  return NextResponse.json(
    { error: { code: ErrorCode.INTERNAL, message: "Internal server error" }, requestId },
    { status: 500 }
  );
}
