import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

interface StepAvatarProps {
  avatarFile: File | null;
  avatarUrl: string | null;
  hasExistingAvatar?: boolean;
  onFileChange: (file: File) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAvatar({
  avatarFile,
  avatarUrl,
  hasExistingAvatar,
  onFileChange,
  onNext,
  onBack,
}: StepAvatarProps) {
  const { t } = useTranslation();
  const canContinue = avatarFile !== null || !!hasExistingAvatar;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("profile.onboarding.avatar_title")}</h1>
        <p className="text-muted-foreground">{t("profile.onboarding.avatar_subtext")}</p>
      </div>

      <AvatarUpload avatarUrl={avatarUrl} onFileChange={onFileChange} />

      {!canContinue && (
        <p className="text-center text-sm text-destructive">
          {t("profile.onboarding.avatar_required")}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          {t("profile.onboarding.back")}
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!canContinue}>
          {t("profile.onboarding.next")}
        </Button>
      </div>
    </div>
  );
}
