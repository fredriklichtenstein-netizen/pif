// "Markera som piffad / uppfylld" from a post's ⋯ menu (Trello #132).
//
// The ⋯ menu used to go straight to mark_item_given_away ("given away outside
// the app"). With a receiver already chosen, that recorded the handover as
// outside PIF, told the receiver it went "på annat sätt" and closed their chat,
// while the chat's own "Markera som piffad" (confirm_pif_handoff) is the
// linked one. Now the menu asks the post's interest button to open its list,
// where the owner picks the person (same confirm_pif_handoff as the chat); the
// list's footer still offers "outside PIF", which comes back to the card's
// MarkGivenAwayDialog through the second event.

const OPEN_LIST = "pif:open-interest-list";
const OPEN_OUTSIDE = "pif:open-given-away-outside";

type Detail = { itemId: string; handled: boolean };

/** Returns true if an interest list for this item opened (a listener answered). */
export function requestInterestList(itemId: string | number): boolean {
  const detail: Detail = { itemId: String(itemId), handled: false };
  window.dispatchEvent(new CustomEvent<Detail>(OPEN_LIST, { detail }));
  return detail.handled;
}

export function onInterestListRequest(itemId: string | number, open: () => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<Detail>).detail;
    if (!detail || detail.handled || detail.itemId !== String(itemId)) return;
    detail.handled = true;
    open();
  };
  window.addEventListener(OPEN_LIST, handler);
  return () => window.removeEventListener(OPEN_LIST, handler);
}

export function requestGivenAwayOutside(itemId: string | number): void {
  window.dispatchEvent(new CustomEvent<Detail>(OPEN_OUTSIDE, { detail: { itemId: String(itemId), handled: false } }));
}

export function onGivenAwayOutsideRequest(itemId: string | number, open: () => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<Detail>).detail;
    if (!detail || detail.handled || detail.itemId !== String(itemId)) return;
    detail.handled = true;
    open();
  };
  window.addEventListener(OPEN_OUTSIDE, handler);
  return () => window.removeEventListener(OPEN_OUTSIDE, handler);
}
