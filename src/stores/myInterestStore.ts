import { create } from "zustand";

/**
 * Tracks whether the current authenticated user has shown interest in
 * a given item. Updated optimistically by the action handler and via
 * realtime by useItemInterestRealtime — so all UIs that toggle their
 * "I'm interested" button off this store stay in sync across tabs and
 * devices.
 */
interface MyInterestState {
  byItem: Record<string, boolean>;
  set: (itemId: string | number, value: boolean) => void;
  setMany: (entries: Array<{ itemId: string | number; value: boolean }>) => void;
  get: (itemId: string | number) => boolean | undefined;
}

export const useMyInterestStore = create<MyInterestState>((set, get) => ({
  byItem: {},
  set: (itemId, value) =>
    set((state) => ({ byItem: { ...state.byItem, [String(itemId)]: value } })),
  setMany: (entries) =>
    set((state) => {
      const next = { ...state.byItem };
      for (const e of entries) next[String(e.itemId)] = e.value;
      return { byItem: next };
    }),
  get: (itemId) => get().byItem[String(itemId)],
}));
