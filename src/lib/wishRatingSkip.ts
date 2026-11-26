// A wish helper who skipped rating the wisher ("Hoppa över") isn't asked
// again on this device -- not in the chat, not by WishRatingPrompt.
const KEY = "pif-wish-rating-skipped";

export function wishRatingSkipped(itemId: string | number): boolean {
  try {
    return (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).includes(String(itemId));
  } catch {
    return false;
  }
}

export function rememberWishRatingSkipped(itemId: string | number): void {
  try {
    const ids = new Set(JSON.parse(localStorage.getItem(KEY) || "[]") as string[]);
    ids.add(String(itemId));
    localStorage.setItem(KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* private mode etc. */
  }
}
