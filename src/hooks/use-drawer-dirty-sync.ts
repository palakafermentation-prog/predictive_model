"use client";

import * as React from "react";
import { useDrawerStore } from "@/stores/drawer-store";

export function useDrawerDirtySync(isDirty: boolean) {
  const setDirty = useDrawerStore((s) => s.setDirty);

  React.useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  React.useEffect(
    () => () => {
      setDirty(false);
    },
    [setDirty]
  );
}
