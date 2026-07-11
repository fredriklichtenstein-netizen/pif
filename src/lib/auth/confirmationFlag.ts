/**
 * Short-lived localStorage marker set by the tab that is actively processing
 * an auth confirmation hash (email signup, magic link, invite, recovery,
 * email change). Bystander tabs check this flag to avoid reacting to the
 * cross-tab SIGNED_IN broadcast with a forced navigation into onboarding.
 *
 * The flag TTLs out on its own after CONFIRMATION_TTL_MS so it can't wedge
 * the app in a "confirmation in progress" state.
 */
const KEY = "pif:confirming";
export const CONFIRMATION_TTL_MS = 5000;

export function markConfirmationInProgress() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function isConfirmationInProgress(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      localStorage.removeItem(KEY);
      return false;
    }
    if (Date.now() - ts > CONFIRMATION_TTL_MS) {
      localStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearConfirmationFlag() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
