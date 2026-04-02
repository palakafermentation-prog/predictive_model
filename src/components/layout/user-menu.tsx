"use client";

import { LogOut, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { useDrawerStore } from "@/stores/drawer-store";
import type { User } from "@pferm/shared-schemas";

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
}

function getDisplayName(user: User): string {
  if (user.firstName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const { openDrawer } = useDrawerStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 rounded-full p-0 hover:opacity-90"
          aria-label="User menu"
        >
          <UserAvatar
            user={user}
            className="h-9 w-9"
            fallbackClassName="text-sm"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              className="h-10 w-10 shrink-0"
              fallbackClassName="text-base"
            />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-medium">
                {getDisplayName(user)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => openDrawer("profile", { user })}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <ThemeSwitcher />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
