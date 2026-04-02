"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/user-store";
import { usePageTitleStore } from "@/stores/page-title-store";
import { signout } from "@/services/frontend/auth";
import { UserMenu } from "./user-menu";

export function Header() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useUserStore();
  const { areaName, entityName } = usePageTitleStore();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function handleSignOut() {
    await signout();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-[73px] items-center justify-between border-b bg-background px-6">
      <div className="flex items-baseline gap-2">
        <h1 className="text-lg font-semibold">{areaName}</h1>
        {entityName && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-base text-muted-foreground">{entityName}</span>
          </>
        )}
      </div>

      <div>
        {isLoading || !user ? (
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        ) : (
          <UserMenu user={user} onSignOut={handleSignOut} />
        )}
      </div>
    </header>
  );
}
