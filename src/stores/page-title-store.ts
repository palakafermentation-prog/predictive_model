import { create } from "zustand";

interface PageTitleState {
  areaName: string;
  entityName: string | undefined;
  setPageTitle: (areaName: string, entityName?: string) => void;
}

export const usePageTitleStore = create<PageTitleState>((set) => ({
  areaName: "Dashboard",
  entityName: undefined,
  setPageTitle: (areaName, entityName) => set({ areaName, entityName }),
}));
