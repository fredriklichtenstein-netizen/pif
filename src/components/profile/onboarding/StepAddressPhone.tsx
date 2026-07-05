import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/profile/address/AddressInput";
import { PhoneInput } from "@/components/profile/PhoneInput";

interface StepAddressPhoneProps {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  phone: string;
  countryCode: string;
  loading: boolean;
  onAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onPhoneChange: (phone: string, countryCode: string) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function StepAddressPhone({
  address,
  coordinates,
  phone,
  countryCode,
  loading,
  onAddressChange,
  onPhoneChange,
  onBack,
  onComplete,
}: StepAddressPhoneProps) {
  const { t } = useTranslation();
  const canComplete = coordinates !== null && address.trim().length > 0 && !loading;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("profile.onboarding.address_title")}</h1>
        <p className="text-muted-foreground">{t("profile.onboarding.address_subtext")}</p>
      </div>

      <div className="space-y-2">
        <AddressInput value={address} onChange={onAddressChange} />
        {!coordinates && address.trim().length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("profile.onboarding.address_required")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="onboarding-phone">
          {t("profile.onboarding.phone_optional_label")}
        </Label>
        <PhoneInput
          value={phone}
          countryCode={countryCode}
          onPhoneChange={onPhoneChange}
          required={false}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
          {t("profile.onboarding.back")}
        </Button>
        <Button className="flex-1" onClick={onComplete} disabled={!canComplete}>
          {loading ? t("profile.onboarding.saving") : t("profile.onboarding.complete")}
        </Button>
      </div>
    </div>
  );
}
