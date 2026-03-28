import { prisma } from "@/lib/prisma";
import type { UserSession } from "./permissions";
import type { ProfileUpdate } from "@pferm/shared-schemas";

export async function updateProfile(user: UserSession, data: ProfileUpdate) {
  const updateData: Record<string, unknown> = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.avatarId !== undefined) updateData.avatarId = data.avatarId || null;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  const authUser = await prisma.authUser.findUnique({
    where: { id: updatedUser.authUserId },
  });

  return {
    id: updatedUser.id,
    email: authUser!.email,
    userType: updatedUser.userType,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phone: updatedUser.phone,
    avatarId: updatedUser.avatarId,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
}
