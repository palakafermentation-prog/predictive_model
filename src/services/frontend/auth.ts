/**
 * Auth Client - Frontend wrapper for authentication API
 */

import {
  type AuthResponse,
  type SessionResponse,
  type ForgotPasswordResponse,
  type ResetPasswordResponse,
} from "@pferm/shared-schemas";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/env";
import { apiFetch, isApiError, type ApiResponse } from "@/lib/api-client";

export class AuthError extends Error {
  constructor(message: string, public code: string, public fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "AuthError";
  }
}

function throwAuthError(response: { error: { code: string; message: string; fieldErrors?: Record<string, string[]> } }): never {
  throw new AuthError(response.error.message, response.error.code, response.error.fieldErrors);
}

const baseUrl = NEXT_PUBLIC_API_BASE_URL;

export async function signup(
  email: string,
  password: string,
  confirmPassword: string,
  firstName: string,
  lastName?: string
): Promise<{ message: string }> {
  const response = await apiFetch<{ message: string }>(`${baseUrl}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword, firstName, lastName }),
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throwAuthError(response);
  return response.data;
}

export async function signin(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>(`${baseUrl}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throwAuthError(response);
  return response.data;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const response = await apiFetch<{ message: string }>(`${baseUrl}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throwAuthError(response);
  return response.data;
}

export async function signout(): Promise<void> {
  const response = await apiFetch<{ message: string }>(`${baseUrl}/auth/signout`, {
    method: "POST",
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throw new Error(response.error.message);
}

export async function getSession(): Promise<SessionResponse | null> {
  const response = await apiFetch<SessionResponse>(`${baseUrl}/auth/session`, {
    skipAuthRedirect: true,
  });

  if (isApiError(response)) return null;
  return response.data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await apiFetch<ForgotPasswordResponse>(`${baseUrl}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throw new Error(response.error.message);
  return response.data;
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> {
  const response = await apiFetch<ResetPasswordResponse>(`${baseUrl}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, confirmPassword }),
    skipAuthRedirect: true,
  });

  if (isApiError(response)) throw new Error(response.error.message);
  return response.data;
}
