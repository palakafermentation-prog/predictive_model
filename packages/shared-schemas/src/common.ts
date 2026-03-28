import { z } from "zod/v4";

// --- Reusable field-level validators ---

export const emailField = z.email("Invalid email address");

export const newPasswordField = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const confirmPasswordField = z
  .string()
  .min(1, "Please confirm your password");

// --- Pagination ---

export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationParams = z.infer<typeof paginationParams>;

export const paginatedResponse = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
  });

// --- API response envelope ---

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
  requestId: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
