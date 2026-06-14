import { create } from "zustand";

export type UserFilterStub = {
  id: string;
  name: string;
  avatar?: string;
  location?: string;
};

interface State {
  profiles: Record<string, UserFilterStub>;
  setProfile: (p: UserFilterStub) => void;
}

/**
 * Tiny in-memory cache of profile stubs so the feed's user-filter header
 * can render instantly when the user taps an avatar/name in the feed
 * before any backend fetch resolves.
 */
export const useUserFilterProfileStore = create<State>((set) => ({
  profiles: {},
  setProfile: (p) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        [p.id]: { ...s.profiles[p.id], ...p },
      },
    })),
}));
