import { useCallback } from "react";

const TOAST_SELECTOR = "#toast-viewport, .toaster, [data-sonner-toaster]";

/**
 * Radix Popover/Dialog/AlertDialog treat any pointerdown outside their own
 * content as an "outside click" and close — including a click inside a
 * toast portal, which lives outside the modal's DOM tree entirely. Pass the
 * returned handler to onPointerDownOutside (and onInteractOutside where
 * available) so dismissing a toast can never also dismiss the modal
 * underneath it.
 */
export function useIgnoreToastOutsideClicks() {
  return useCallback((event: { target: EventTarget | null; preventDefault: () => void }) => {
    const target = event.target as Element | null;
    if (target?.closest?.(TOAST_SELECTOR)) {
      event.preventDefault();
    }
  }, []);
}
