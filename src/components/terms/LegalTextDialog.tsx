import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TermsContent } from "@/pages/Terms";
import { PrivacyContent } from "@/pages/Privacy";

export type LegalDoc = "terms" | "privacy";

/**
 * The terms of use or the privacy policy in a dialog, for places where leaving
 * the page would lose what the person was doing (sign-up, Skapa profil).
 * Never a new tab/window: in an installed PWA that opens a second app window,
 * and in the native apps it doesn't work at all.
 */
export function LegalTextDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={doc !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="sr-only">
          {doc === "privacy" ? t("terms.consent_privacy") : t("terms.consent_terms")}
        </DialogTitle>
        {doc === "terms" && <TermsContent />}
        {doc === "privacy" && <PrivacyContent />}
      </DialogContent>
    </Dialog>
  );
}
