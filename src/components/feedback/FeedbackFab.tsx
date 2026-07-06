import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { FeedbackDialog } from "./FeedbackDialog";

/**
 * Global floating feedback CTA. Mounted once at the App root.
 *
 * Position: bottom-right, well above the bottom MainNav pill AND above the
 * bottom-right form CTAs ("Nästa", "Slutför", "Publicera") that sit just
 * above the nav on form pages. bottom-40 (160px) clears both.
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
        className="fixed bottom-40 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-1 ring-black/5 transition-transform hover:bg-primary-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
