import { create } from "zustand";
import { toast } from "sonner";
import type { User } from "@pferm/shared-schemas";

type DrawerContentType = "profile" | "batch_detail";

interface DrawerConfig {
  title: string;
  description?: string;
  width: "sm" | "md" | "lg" | "xl";
}

const drawerConfigs: Record<DrawerContentType, DrawerConfig> = {
  profile: {
    title: "Profile Settings",
    description: "Manage your account information",
    width: "lg",
  },
  batch_detail: {
    title: "Batch Detail",
    width: "lg",
  },
};

type DrawerContentProps = {
  profile: { user: User };
  batch_detail: { id: string };
};

interface DrawerState {
  isOpen: boolean;
  contentType: DrawerContentType | null;
  contentProps: Record<string, unknown>;
  canClose: boolean;
  isDirty: boolean;

  openDrawer: <T extends DrawerContentType>(
    type: T,
    props: DrawerContentProps[T],
    options?: { canClose?: boolean }
  ) => void;
  closeDrawer: () => void;
  closeWithSuccess: (message: string) => void;
  setDirty: (dirty: boolean) => void;
  getConfig: () => DrawerConfig | null;
}

export const useDrawerStore = create<DrawerState>((set, get) => ({
  isOpen: false,
  contentType: null,
  contentProps: {},
  canClose: true,
  isDirty: false,

  openDrawer: (type, props, options) => {
    set({
      isOpen: true,
      contentType: type,
      contentProps: props,
      canClose: options?.canClose ?? true,
      isDirty: false,
    });
  },

  closeDrawer: () => {
    set({
      isOpen: false,
      contentType: null,
      contentProps: {},
      canClose: true,
      isDirty: false,
    });
  },

  closeWithSuccess: (message: string) => {
    toast.success(message);
    setTimeout(() => {
      get().closeDrawer();
    }, 150);
  },

  setDirty: (dirty: boolean) => {
    set({ isDirty: dirty });
  },

  getConfig: () => {
    const { contentType } = get();
    if (!contentType) return null;
    return drawerConfigs[contentType];
  },
}));

export { drawerConfigs };
export type { DrawerContentType, DrawerConfig, DrawerContentProps };
