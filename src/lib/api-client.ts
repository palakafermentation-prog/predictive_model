/**
 * API Client - Centralized fetch wrapper with typed responses and global 401 handling.
 *
 * Returns typed ApiResponse<T> (discriminated union) instead of raw Response.
 * Frontend code uses isApiError() to check the response type.
 */

const AUTH_PATHS = [
  "/sign-in",
  "/forgot-password",
  "/reset-password",
];

const DEFAULT_TIMEOUT_MS = 30_000;

function isAuthPath(): boolean {
  if (typeof window === "undefined") return false;
  return AUTH_PATHS.some((path) => window.location.pathname.startsWith(path));
}

async function handleUnauthorized(): Promise<void> {
  if (isAuthPath()) return;

  const { useUserStore } = await import("@/stores/user-store");

  useUserStore.getState().clearUser();

  window.location.href = "/sign-in";
}

// --- Typed response shapes (match backend handleApiError output) ---

export interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
  requestId?: string;
}

export interface ApiSuccess<T> {
  data: T;
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(response: ApiResponse<T>): response is ApiError {
  return "error" in response;
}

// --- Fetch wrapper ---

type FetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
  timeoutMs?: number;
};

export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const { skipAuthRedirect, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { error: { code: "TIMEOUT", message: "Request timed out. Please try again." } };
    }
    return { error: { code: "NETWORK_ERROR", message: "Could not connect to the server. Check your connection and try again." } };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && !skipAuthRedirect) {
    await handleUnauthorized();
    return { error: { code: "UNAUTHORIZED", message: "Session expired" } };
  }

  try {
    const json = await response.json();
    return json as ApiResponse<T>;
  } catch {
    return { error: { code: "INTERNAL", message: "Unexpected response from server." } };
  }
}
