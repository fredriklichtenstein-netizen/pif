import { toast, type ExternalToast } from "sonner";

/**
 * A sonner toast that is guaranteed to go away. Sonner pauses its own timer
 * while the pointer is over the toaster and can stay paused while a Radix
 * modal (sheet/dialog) is open, which left toasts on screen until reload.
 * We dismiss explicitly after `ms` as well.
 */
export function flashToast(
  kind: "success" | "error" | "message",
  text: string,
  ms = 2500,
  options: ExternalToast = {},
): string | number {
  const id =
    kind === "success"
      ? toast.success(text, { ...options, duration: ms })
      : kind === "error"
        ? toast.error(text, { ...options, duration: ms })
        : toast(text, { ...options, duration: ms });
  setTimeout(() => toast.dismiss(id), ms + 300);
  return id;
}
