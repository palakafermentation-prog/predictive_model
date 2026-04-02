/**
 * Centralized Permissions Module
 *
 * Guard functions throw ForbiddenError if unauthorized.
 */

import { ForbiddenError } from "@/lib/errors";

export interface UserSession {
  id: string;
  email: string;
  userType: "user" | "super_admin";
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  avatarId?: string | null;
}

export async function requireSuperAdmin(user: UserSession): Promise<void> {
  if (user.userType !== "super_admin") {
    throw new ForbiddenError("Super admin access required");
  }
}

export async function requireOwner(user: UserSession, resourceUserId: string): Promise<void> {
  if (user.userType === "super_admin") return;
  if (user.id !== resourceUserId) {
    throw new ForbiddenError("You do not have permission to access this resource");
  }
}
