import { create } from "zustand";

/**
 * Has the signed-in person accepted the current terms of use (TERMS_VERSION)?
 * Loaded by TermsGate (mounted in App), which also owns the one-time screen.
 *
 * "unknown" = not loaded yet (or signed out): actions go through as before,
 * so a slow or failed lookup never blocks anyone.
 */
export type TermsStatus = "unknown" | "accepted" | "required";

interface TermsState {
  status: TermsStatus;
  screenOpen: boolean;
  setStatus: (status: TermsStatus) => void;
  openScreen: () => void;
  closeScreen: () => void;
}

export const useTermsStore = create<TermsState>((set) => ({
  status: "unknown",
  screenOpen: false,
  setStatus: (status) => set({ status, ...(status === "accepted" ? { screenOpen: false } : {}) }),
  openScreen: () => set({ screenOpen: true }),
  closeScreen: () => set({ screenOpen: false }),
}));

/**
 * Call before posting, showing interest, commenting or sending a message.
 * Returns false (and shows the terms screen) when the person hasn't accepted
 * the current terms yet; the caller then stops.
 */
export function ensureTermsAccepted(): boolean {
  const { status, openScreen } = useTermsStore.getState();
  if (status !== "required") return true;
  openScreen();
  return false;
}
