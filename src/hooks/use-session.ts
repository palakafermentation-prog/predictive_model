"use client";

import { useUserStore } from "@/stores/user-store";

export function useSession() {
  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  return { user, isLoading };
}
