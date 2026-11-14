import { create } from "zustand";

export interface ProfileSheetTarget {
  id: string;
  /** Shown instantly while the full profile loads. */
  name?: string;
  avatar?: string;
}

interface State {
  target: ProfileSheetTarget | null;
  open: (target: ProfileSheetTarget) => void;
  close: () => void;
}

/** Which user's profile popup (UserProfileSheet, mounted once in App) is open. */
export const useProfileSheetStore = create<State>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
