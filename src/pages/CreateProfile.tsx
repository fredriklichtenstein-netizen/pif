import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { sanitizeFilename } from "@/utils/sanitizeFilename";
import { OnboardingProgress } from "@/components/profile/onboarding/OnboardingProgress";
import { StepWelcomeName } from "@/components/profile/onboarding/StepWelcomeName";
import { StepAvatar } from "@/components/profile/onboarding/StepAvatar";
import { StepAddressPhone } from "@/components/profile/onboarding/StepAddressPhone";

type Coordinates = { lat: number; lng: number };

const TOTAL_STEPS = 3;

export default function CreateProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+46");

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAddressChange = (nextAddress: string, coords?: Coordinates) => {
    setAddress(nextAddress);
    if (coords) {
      setCoordinates(coords);
    } else {
      // Free typing invalidates a previously geocoded selection.
      setCoordinates(null);
    }
  };

  const handleComplete = async () => {
    if (!avatarFile || !coordinates) return;
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Upload avatar
      const safeName = sanitizeFilename(avatarFile.name);
      const fileExt = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, avatarFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl: avatarUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      // Resolve city from coordinates
      let city: string | null = null;
      try {
        const { reverseGeocodeCity } = await import("@/utils/location/reverseGeocodeCity");
        city = (await reverseGeocodeCity(coordinates.lng, coordinates.lat)) || null;
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }

      const username = user.email ? user.email.split("@")[0] : `user_${Date.now()}`;
      const trimmedPhone = phone.trim();
      const persistedPhone = trimmedPhone.length > 0 ? `${countryCode}${trimmedPhone}` : null;

      const profileData: any = {
        id: user.id,
        username,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUrl,
        address: address.trim(),
        city,
        location_json: { lng: coordinates.lng, lat: coordinates.lat },
        phone: persistedPhone,
        onboarding_completed: true,
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(profileData);
      if (upsertError) throw upsertError;

      useAuthStore.getState().setProfileCompleted(true);

      toast({
        title: t("profile.created"),
        description: t("profile.created_description"),
      });

      navigate("/home", { replace: true });
    } catch (error: any) {
      console.error("Onboarding submission error:", error);
      toast({
        title: t("profile.create_error"),
        description: error.message || t("profile.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>

        <OnboardingProgress current={step} total={TOTAL_STEPS} />

        <Card>
          <CardContent className="pt-6">
            {step === 1 && (
              <StepWelcomeName
                firstName={firstName}
                lastName={lastName}
                onChange={(patch) => {
                  if (patch.firstName !== undefined) setFirstName(patch.firstName);
                  if (patch.lastName !== undefined) setLastName(patch.lastName);
                }}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepAvatar
                avatarFile={avatarFile}
                avatarUrl={avatarPreview}
                onFileChange={handleAvatarChange}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <StepAddressPhone
                address={address}
                coordinates={coordinates}
                phone={phone}
                countryCode={countryCode}
                loading={loading}
                onAddressChange={handleAddressChange}
                onPhoneChange={(newPhone, newCountryCode) => {
                  setPhone(newPhone);
                  setCountryCode(newCountryCode);
                }}
                onBack={() => setStep(2)}
                onComplete={handleComplete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
