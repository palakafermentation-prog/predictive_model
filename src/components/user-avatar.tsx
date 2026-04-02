"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAvatarStore } from "@/stores/avatar-store";
import { cn } from "@/lib/utils";
import type { User } from "@pferm/shared-schemas";

interface UserAvatarProps {
  user: User;
  className?: string;
  fallbackClassName?: string;
}

function getInitials(user: User): string {
  if (user.firstName) {
    const last = user.lastName?.trim();
    return (user.firstName[0] + (last ? last[0] : "")).toUpperCase();
  }
  return user.email[0].toUpperCase();
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const { avatarId, avatarKey } = useAvatarStore();

  // Use store avatarId (reflects latest upload) or fall back to user.avatarId
  const resolvedAvatarId = avatarId ?? user.avatarId;
  const avatarUrl = resolvedAvatarId
    ? `/api/media/${resolvedAvatarId}?k=${avatarKey}`
    : null;

  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={
            user.firstName
              ? `${user.firstName}'s avatar`
              : "User avatar"
          }
        />
      )}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-semibold",
          fallbackClassName
        )}
      >
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}
