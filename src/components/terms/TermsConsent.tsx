import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { LegalTextDialog, type LegalDoc } from "@/components/terms/LegalTextDialog";

interface TermsConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * "Jag godkänner användarvillkoren och integritetspolicyn". The two links open
 * the texts in a dialog instead of navigating: leaving the page would lose the
 * form, and a new tab doesn't work inside the native apps.
 */
export function TermsConsent({ checked, onCheckedChange, disabled }: TermsConsentProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<LegalDoc | null>(null);
  const linkClass = "text-primary underline underline-offset-2";

  return (
    <>
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms-consent"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          disabled={disabled}
          className="mt-0.5"
        />
        <label htmlFor="terms-consent" className="text-sm leading-snug cursor-pointer">
          {t("terms.consent_prefix")}
          <button type="button" className={linkClass} onClick={() => setOpen("terms")}>
            {t("terms.consent_terms")}
          </button>
          {t("terms.consent_middle")}
          <button type="button" className={linkClass} onClick={() => setOpen("privacy")}>
            {t("terms.consent_privacy")}
          </button>
          {t("terms.consent_suffix")}
        </label>
      </div>

      <LegalTextDialog doc={open} onClose={() => setOpen(null)} />
    </>
  );
}
