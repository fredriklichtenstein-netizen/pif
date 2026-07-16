import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/profile/address/AddressInput";
import { PhoneInput } from "@/components/profile/PhoneInput";
import { useMapbox } from "@/hooks/useMapbox";

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
  const { t, i18n } = useTranslation();
  const geocodeLang = i18n.language?.startsWith("sv") ? "sv" : "en";
  const { mapToken } = useMapbox();
  const [geocoding, setGeocoding] = useState(false);
  const canComplete = coordinates !== null && address.trim().length > 0 && !loading;

  // Fallback: if the user types a full address and never picks a suggestion,
  // resolve coordinates on blur so the "Complete" button unblocks.
  const handleAddressBlur = async () => {
    const trimmed = address.trim();
    if (!trimmed || coordinates || !mapToken || geocoding) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmed,
        )}.json?access_token=${mapToken}&language=${geocodeLang}&types=address&limit=1`,
      );
      if (!res.ok) return;
      const json = await res.json();
      const feature = json?.features?.[0];
      if (feature?.center?.length === 2) {
        const [lng, lat] = feature.center;
        onAddressChange(feature.place_name || trimmed, { lat, lng });
      }
    } catch (err) {
      console.warn("Onboarding blur-geocode failed:", err);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("profile.onboarding.address_title")}</h1>
        <p className="text-muted-foreground">{t("profile.onboarding.address_subtext")}</p>
      </div>

      <div className="space-y-2" onBlur={handleAddressBlur}>
        <AddressInput value={address} onChange={onAddressChange} hideSearch />
        {!coordinates && address.trim().length > 0 && !geocoding && (
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
