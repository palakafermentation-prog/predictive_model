import { create } from "zustand";

interface AuthGateState {
  isOpen: boolean;
  openAuthGate: () => void;
  closeAuthGate: () => void;
}

export const useAuthGateStore = create<AuthGateState>((set) => ({
  isOpen: false,
  openAuthGate: () => set({ isOpen: true }),
  closeAuthGate: () => set({ isOpen: false }),
}));
