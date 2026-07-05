import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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

const KNOWN_COUNTRY_CODES = ["+358", "+46", "+45", "+47"];

function splitPhone(phone: string | null | undefined): { countryCode: string; local: string } {
  const raw = (phone || "").trim();
  if (!raw) return { countryCode: "+46", local: "" };
  for (const code of KNOWN_COUNTRY_CODES) {
    if (raw.startsWith(code)) {
      return { countryCode: code, local: raw.slice(code.length) };
    }
  }
  return { countryCode: "+46", local: raw.replace(/^\+/, "") };
}

function parseLocation(loc: any): Coordinates | null {
  if (!loc) return null;
  const lng = Number(loc.lng ?? loc.x);
  const lat = Number(loc.lat ?? loc.y);
  if (Number.isFinite(lng) && Number.isFinite(lat)) return { lat, lng };
  return null;
}

export default function CreateProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prefillLoading, setPrefillLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [existingCity, setExistingCity] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+46");

  // Prefill from existing profile row, then decide where to resume.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setPrefillLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name,last_name,avatar_url,address,city,location_json,phone,onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        const fName = (profile?.first_name || "").trim();
        const lName = (profile?.last_name || "").trim();
        const avUrl = profile?.avatar_url || null;
        const addr = (profile?.address || "").trim();
        const coords = parseLocation((profile as any)?.location_json);
        const { countryCode: cc, local } = splitPhone(profile?.phone);

        setFirstName(fName);
        setLastName(lName);
        setExistingAvatarUrl(avUrl);
        setAvatarPreview(avUrl);
        setAddress(addr);
        setCoordinates(coords);
        setExistingCity(profile?.city || null);
        setCountryCode(cc);
        setPhone(local);

        const hasName = fName.length > 0 && lName.length > 0;
        const hasAvatar = !!avUrl;
        const hasAddress = addr.length > 0 && !!coords;

        // Silent completion: all mandatory fields present but the flag is
        // not yet set. Flip it in the background and go straight to /home
        // without ever rendering the wizard.
        if (hasName && hasAvatar && hasAddress && !profile?.onboarding_completed) {
          const { error } = await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id);
          if (!error) {
            useAuthStore.getState().setProfileCompleted(true);
            navigate("/", { replace: true });
            return;
          }
        }

        // Otherwise resume at the first step missing mandatory data.
        if (!hasName) setStep(1);
        else if (!hasAvatar) setStep(2);
        else setStep(3);

        setPrefillLoading(false);
      } catch (err) {
        console.warn("Onboarding prefill failed:", err);
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
    if (!coordinates) return;
    if (!avatarFile && !existingAvatarUrl) return;
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Upload avatar only if the user picked a new file.
      let avatarUrl = existingAvatarUrl;
      if (avatarFile) {
        const safeName = sanitizeFilename(avatarFile.name);
        const fileExt = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      // Resolve city from coordinates (skip if we already have one that matches).
      let city: string | null = existingCity;
      if (!city) {
        try {
          const { reverseGeocodeCity } = await import("@/utils/location/reverseGeocodeCity");
          city = (await reverseGeocodeCity(coordinates.lng, coordinates.lat)) || null;
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
        }
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

  if (prefillLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("profile.loading")}</p>
      </div>
    );
  }

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
                hasExistingAvatar={!!existingAvatarUrl}
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
