import { z } from "zod/v4";
import { emailField, newPasswordField, confirmPasswordField } from "./common";

export const UserTypeSchema = z.enum(["user", "super_admin"]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  userType: UserTypeSchema,
  firstName: z.string(),
  lastName: z.string().nullish(),
  phone: z.string().nullish(),
  avatarId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const SigninFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordFormSchema = z.object({
  email: emailField,
});

export const ResetPasswordFormSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: newPasswordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const AuthResponseSchema = z.object({
  user: UserSchema,
  message: z.string().optional(),
});

export const SessionResponseSchema = z.object({
  user: UserSchema,
  expiresAt: z.coerce.date(),
});

export const ForgotPasswordResponseSchema = z.object({
  message: z.string(),
  emailFailed: z.boolean().optional(),
});

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const SignupFormSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    email: emailField,
    password: newPasswordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResendVerificationSchema = z.object({
  email: emailField,
});

export const CreateSuperAdminSchema = z.object({
  email: emailField,
  password: newPasswordField,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export type CreateSuperAdmin = z.infer<typeof CreateSuperAdminSchema>;
export type SignupForm = z.infer<typeof SignupFormSchema>;
export type ResendVerification = z.infer<typeof ResendVerificationSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;
export type User = z.infer<typeof UserSchema>;
export type SigninForm = z.infer<typeof SigninFormSchema>;
export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>;
export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
