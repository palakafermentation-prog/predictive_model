import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@pferm/shared-schemas";
import { generateUserId } from "@pferm/shared-lib";
import { UnauthorizedError, BadRequestError, ConflictError, EmailNotVerifiedError } from "@/lib/errors";

/**
 * Auth Service - wraps BetterAuth with custom business logic
 */

/**
 * Build unified user object from AuthUser + User tables
 */
async function buildUnifiedUser(authUserId: string): Promise<User> {
  const authUser = await prisma.authUser.findUnique({
    where: { id: authUserId },
  });

  if (!authUser) {
    throw new Error("Auth user not found");
  }

  const customUser = await prisma.user.findUnique({
    where: { authUserId },
  });

  if (!customUser) {
    throw new Error("User not found");
  }

  return {
    id: customUser.id,
    email: authUser.email,
    userType: customUser.userType,
    firstName: customUser.firstName,
    lastName: customUser.lastName,
    phone: customUser.phone,
    avatarId: customUser.avatarId,
    createdAt: customUser.createdAt,
    updatedAt: customUser.updatedAt,
  };
}

/**
 * Extract session token from request — checks Authorization header first, then cookies
 */
function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies["pferm-auth.session_token"] ?? null;
}

/**
 * Sign up a new user. Always creates a regular 'user' role.
 * Super admin is created exclusively via the seed script.
 * Email verification is required before sign-in.
 */
export async function signup(
  email: string,
  password: string,
  firstName: string,
  lastName?: string
): Promise<{ message: string }> {

  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  let authResult;
  try {
    authResult = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    if (msg.includes("email") && msg.includes("exist")) {
      throw new ConflictError("An account with that email already exists.");
    }
    // Check BetterAuth APIError shape
    if (typeof error === "object" && error !== null && "status" in error) {
      const e = error as { status: number };
      if (e.status === 422 || e.status === 409) {
        throw new ConflictError("An account with that email already exists.");
      }
    }
    throw error;
  }

  if (!authResult?.user) {
    throw new Error("Failed to create user");
  }

  await prisma.user.create({
    data: {
      id: generateUserId(),
      authUserId: authResult.user.id,
      userType: "user",
      firstName,
      lastName,
    },
  });

  // BetterAuth sends verification email during signUpEmail().
  // If SMTP failed, the account was still created but the email wasn't sent.
  // We can't easily detect that here since the error is swallowed by BetterAuth.
  // The resendVerification flow handles retries.
  return {
    message: "Account created. Please check your email to verify your account before signing in.",
  };
}

/**
 * Sign in a user. Throws EmailNotVerifiedError if email is unverified.
 */
export async function signin(email: string, password: string) {
  let result;
  try {
    result = await auth.api.signInEmail({
      body: { email, password },
    });
  } catch (error: unknown) {
    if (error instanceof EmailNotVerifiedError) throw error;

    // If BetterAuth blocked sign-in, check if it's due to unverified email
    const authUser = await prisma.authUser.findUnique({ where: { email } });
    if (authUser && !authUser.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    throw new UnauthorizedError("Invalid credentials");
  }

  if (!result.user || !result.token) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const user = await buildUnifiedUser(result.user.id);

  return {
    user,
    token: result.token,
  };
}

/**
 * Sign out a user — deletes session from DB (supports both cookie and bearer token)
 */
export async function signout(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return;

  await prisma.authSession.deleteMany({ where: { token } });
}

/**
 * Get session from request — supports both bearer token and cookie auth
 */
export async function getSession(request: Request): Promise<{ user: User; expiresAt: Date } | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    const session = await prisma.authSession.findUnique({
      where: { token },
    });

    if (!session) return null;
    if (new Date() > session.expiresAt) return null;

    const user = await buildUnifiedUser(session.userId);

    return { user, expiresAt: session.expiresAt };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

/**
 * Get session using next/headers (for server components and secure layout)
 */
export async function getServerSession(): Promise<{ user: User; expiresAt: Date } | null> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const token = cookies["pferm-auth.session_token"];
    if (!token) return null;

    const session = await prisma.authSession.findUnique({
      where: { token },
    });

    if (!session) return null;
    if (new Date() > session.expiresAt) return null;

    const user = await buildUnifiedUser(session.userId);

    return { user, expiresAt: session.expiresAt };
  } catch (error) {
    console.error("Get current session error:", error);
    return null;
  }
}

/**
 * Get total count of users
 */
export async function userCount(): Promise<number> {
  return await prisma.user.count();
}

/**
 * Verify email address using the token from the verification link
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  try {
    await auth.api.verifyEmail({ query: { token } });
    return { message: "Email verified successfully. You can now sign in." };
  } catch (error) {
    console.error("Verify email error:", error);
    throw new BadRequestError("Invalid or expired verification token. Please request a new verification email.");
  }
}

/**
 * Resend verification email. Always returns success to prevent user enumeration.
 */
export async function resendVerification(email: string): Promise<{ message: string; emailFailed?: boolean }> {
  try {
    await auth.api.sendVerificationEmail({ body: { email } });
  } catch (error) {
    console.error("Resend verification error:", error);
    const isSmtpError = error instanceof Error && (
      error.message.includes("SMTP") || error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") || error.message.includes("connect")
    );
    if (isSmtpError) {
      return {
        message: "Verification email could not be sent. Please try again later.",
        emailFailed: true,
      };
    }
  }

  return {
    message: "If an account with that email exists and is unverified, a new verification email has been sent.",
  };
}

/**
 * Request password reset — sends reset link via configured callback (logs to console in dev)
 */
export async function forgotPassword(email: string): Promise<{ message: string; emailFailed?: boolean }> {
  console.log(`[Auth] forgotPassword called for email="${email}"`);
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
    console.log(`[Auth] requestPasswordReset completed for email="${email}"`);
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    const isSmtpError = error instanceof Error && (
      error.message.includes("SMTP") || error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") || error.message.includes("connect")
    );
    if (isSmtpError) {
      return {
        message: "Password reset email could not be sent. Please try again later.",
        emailFailed: true,
      };
    }
  }

  return {
    message: "If an account with that email exists, a password reset link has been sent.",
  };
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  try {
    await auth.api.resetPassword({
      body: { token, newPassword },
    });

    return {
      message: "Password has been reset successfully. You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    throw new BadRequestError(
      "Invalid or expired reset token. Please request a new password reset link."
    );
  }
}
