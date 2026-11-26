// Someone who skipped a rating prompt ("Hoppa över") isn't asked again for
// that post on this device -- not in the chat, not by RatingPrompt. Used for
// a pif's piffer (rating the receiver) and a wish's helper (rating the wisher).
const KEY = "pif-rating-skipped";

export function ratingSkipped(itemId: string | number): boolean {
  try {
    return (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).includes(String(itemId));
  } catch {
    return false;
  }
}

export function rememberRatingSkipped(itemId: string | number): void {
  try {
    const ids = new Set(JSON.parse(localStorage.getItem(KEY) || "[]") as string[]);
    ids.add(String(itemId));
    localStorage.setItem(KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* private mode etc. */
  }
}
