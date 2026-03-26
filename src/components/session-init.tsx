"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/user-store";

export function SessionInit() {
  const refreshUser = useUserStore((s) => s.refreshUser);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return null;
}
