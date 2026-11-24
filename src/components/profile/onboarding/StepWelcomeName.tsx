import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TermsConsent } from "@/components/terms/TermsConsent";

interface StepWelcomeNameProps {
  firstName: string;
  lastName: string;
  onChange: (patch: { firstName?: string; lastName?: string }) => void;
  onNext: () => void;
  /** "Jag godkänner användarvillkoren och integritetspolicyn" (required). */
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
}

export function StepWelcomeName({ firstName, lastName, onChange, onNext, termsAccepted, onTermsAcceptedChange }: StepWelcomeNameProps) {
  const { t } = useTranslation();
  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0 && termsAccepted;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("profile.onboarding.welcome_title")}</h1>
        <p className="text-muted-foreground">{t("profile.onboarding.welcome_subtext")}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("profile.onboarding.first_name_label")}</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("profile.onboarding.last_name_label")}</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <TermsConsent checked={termsAccepted} onCheckedChange={onTermsAcceptedChange} />

      <Button className="w-full" onClick={onNext} disabled={!canContinue}>
        {t("profile.onboarding.next")}
      </Button>
    </div>
  );
}
