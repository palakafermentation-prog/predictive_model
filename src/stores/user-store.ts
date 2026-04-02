import { create } from "zustand";
import { getSession } from "@/services/frontend/auth";
import type { User } from "@pferm/shared-schemas";

interface UserState {
  user: User | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const session = await getSession();
      set({ user: session?.user || null });
    } catch (error) {
      console.error("Failed to refresh user:", error);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  clearUser: () => set({ user: null }),
}));
