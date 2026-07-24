import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PickupPreferencesFields, type PickupPreferencesData } from "@/components/profile/PickupPreferencesFields";

interface StepPickupPreferencesProps {
  address: string;
  data: PickupPreferencesData;
  loading: boolean;
  onChange: (data: PickupPreferencesData) => void;
  onBack: () => void;
  onComplete: () => void;
}

/**
 * Optional final onboarding step: offers to set up default pif hand-off
 * preferences right away (reusing the same fields as Profile Settings),
 * or skip and set them up later. Either path ends the wizard.
 */
export function StepPickupPreferences({
  address,
  data,
  loading,
  onChange,
  onBack,
  onComplete,
}: StepPickupPreferencesProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t("profile.onboarding.pickup_prompt_title")}</h1>
          <p className="text-muted-foreground">{t("profile.onboarding.pickup_prompt_subtext")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" className="w-full" onClick={() => setExpanded(true)} disabled={loading}>
            {t("profile.onboarding.pickup_prompt_yes")}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onComplete} disabled={loading}>
            {loading ? t("profile.onboarding.saving") : t("profile.onboarding.pickup_prompt_later")}
          </Button>
        </div>

        <Button type="button" variant="ghost" className="w-full" onClick={onBack} disabled={loading}>
          {t("profile.onboarding.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("profile.onboarding.pickup_prompt_title")}</h1>
        <p className="text-muted-foreground">{t("profile.onboarding.pickup_prompt_subtext")}</p>
      </div>

      <PickupPreferencesFields primaryAddress={address} formData={data} onChange={onChange} />

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setExpanded(false)} disabled={loading}>
          {t("profile.onboarding.back")}
        </Button>
        <Button className="flex-1" onClick={onComplete} disabled={loading}>
          {loading ? t("profile.onboarding.saving") : t("profile.onboarding.complete")}
        </Button>
      </div>
    </div>
  );
}
