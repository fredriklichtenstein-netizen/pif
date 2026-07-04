import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { FeedbackDialog } from "./FeedbackDialog";

/**
 * Global floating feedback CTA. Mounted once at the App root.
 *
 * Position: bottom-right, above the bottom MainNav (which sits at bottom-4
 * centered as a pill with max-w-md). At narrow viewports the nav pill spans
 * near-full width but stays centered; the FAB sits to the right of it with
 * right-4 offset and bottom-24 to clear the nav vertically as well.
 *
 * z-40 keeps it below the nav (z-50) so nav taps always win if they ever
 * overlap.
 */
export function FeedbackFab() {
  const { user } = useGlobalAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("interactions.feedback.fab_aria")}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-1 ring-black/5 transition-transform hover:bg-primary-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
