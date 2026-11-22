import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export interface BlockTarget {
  id: string;
  name?: string;
  /** Runs after a confirmed block (e.g. the profile sheet closes itself). */
  onBlocked?: () => void;
}

interface BlockState {
  /** Users the app hides from me: people I blocked and people who blocked me. */
  hiddenIds: Set<string>;
  loadedFor: string | null;
  /** The block confirmation dialog (BlockUserDialogHost, mounted once in App). */
  pending: BlockTarget | null;
  load: (userId: string | null) => Promise<void>;
  requestBlock: (target: BlockTarget) => void;
  cancelRequest: () => void;
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
}

// Called through the client object: supabase.rpc uses `this`, so a detached
// reference fails with "undefined is not an object (evaluating 'this.rest')".
const rpc = (
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: any; error: { message: string } | null }> =>
  (args === undefined ? (supabase.rpc as any)(fn) : (supabase.rpc as any)(fn, args)) as Promise<{ data: any; error: { message: string } | null }>;

export const useBlockStore = create<BlockState>((set, get) => ({
  hiddenIds: new Set(),
  loadedFor: null,
  pending: null,

  load: async (userId) => {
    if (!userId) {
      set({ hiddenIds: new Set(), loadedFor: null });
      return;
    }
    const { data, error } = await rpc("get_hidden_user_ids");
    if (error) {
      console.warn("[blocks] load failed", error.message);
      return;
    }
    const ids = (Array.isArray(data) ? data : []).map((row: any) =>
      String(typeof row === "string" ? row : row?.get_hidden_user_ids ?? row),
    );
    set({ hiddenIds: new Set(ids), loadedFor: userId });
  },

  requestBlock: (target) => set({ pending: target }),
  cancelRequest: () => set({ pending: null }),

  block: async (userId) => {
    const { error } = await rpc("block_user", { p_user_id: userId });
    if (error) throw new Error(error.message);
    const next = new Set(get().hiddenIds);
    next.add(userId);
    set({ hiddenIds: next });
  },

  unblock: async (userId) => {
    const { error } = await rpc("unblock_user", { p_user_id: userId });
    if (error) throw new Error(error.message);
    // They may still have blocked me, so reload instead of just removing.
    await get().load(get().loadedFor);
  },
}));

/** True if this user's content should be hidden from me. */
export const isHiddenUser = (userId: string | null | undefined): boolean =>
  !!userId && useBlockStore.getState().hiddenIds.has(String(userId));

/** The database refuses writes between blocked users with this message. */
export const isUserBlockedError = (error: unknown): boolean =>
  /user_blocked/.test(
    String((error as { message?: string } | null)?.message ?? error ?? ""),
  );
