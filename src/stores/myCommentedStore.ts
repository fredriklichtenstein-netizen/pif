import { create } from "zustand";

/**
 * Tracks whether the current authenticated user has commented on a given item.
 * Mirrors myLikedStore/myInterestStore so per-card "hasCommented" state
 * hydrates correctly on every mount/page refresh instead of only becoming
 * known after the user opens the comments section.
 */
interface MyCommentedState {
  byItem: Record<string, boolean>;
  set: (itemId: string | number, value: boolean) => void;
  setMany: (entries: Array<{ itemId: string | number; value: boolean }>) => void;
  get: (itemId: string | number) => boolean | undefined;
}

export const useMyCommentedStore = create<MyCommentedState>((set, get) => ({
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
