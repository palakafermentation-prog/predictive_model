import { create } from "zustand";

interface AvatarStore {
  avatarId: string | null;
  avatarKey: number;
  isUploading: boolean;
  setAvatarId: (id: string | null) => void;
  refreshAvatar: () => void;
  setIsUploading: (uploading: boolean) => void;
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatarId: null,
  avatarKey: Date.now(),
  isUploading: false,

  setAvatarId: (id: string | null) => {
    set({ avatarId: id });
  },

  refreshAvatar: () => {
    set({ avatarKey: Date.now() });
  },

  setIsUploading: (uploading: boolean) => {
    set({ isUploading: uploading });
  },
}));
