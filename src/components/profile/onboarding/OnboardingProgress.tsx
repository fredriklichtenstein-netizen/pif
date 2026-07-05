import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const { t } = useTranslation();
  const value = (current / total) * 100;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground text-center">
        {t("profile.onboarding.step_indicator", { current, total })}
      </p>
      <Progress value={value} className="h-2" />
    </div>
  );
}
