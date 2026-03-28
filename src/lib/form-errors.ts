import type { FieldValues, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/lib/api-client";

/**
 * Maps server-side field errors (from handleApiError's VALIDATION response)
 * to react-hook-form field errors so they display inline on the form.
 */
export function mapServerErrors<T extends FieldValues>(
  apiError: ApiError,
  setError: UseFormSetError<T>
) {
  const { fieldErrors } = apiError.error;
  if (!fieldErrors) return;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      setError(field as Parameters<UseFormSetError<T>>[0], {
        type: "server",
        message: messages[0],
      });
    }
  }
}
