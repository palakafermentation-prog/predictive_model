"use client";

import { useEffect } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clear stale BetterAuth session cookies when visiting public routes
    document.cookie =
      "pferm-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie =
      "pferm-auth.csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  }, []);

  return <main>{children}</main>;
}
