
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2 } from "lucide-react";
import { ProfileFormData } from "@/hooks/profile/types";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { useProfileAvatar } from "@/hooks/profile/useProfileAvatar";
import { useTranslation } from "react-i18next";
import { MainNav } from "@/components/MainNav";

function ProfileEdit() {
  const { user, isLoading } = useGlobalAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { setAvatar, avatarUrl, loading: avatarLoading, setAvatarUrl } = useProfileAvatar();
  
  useEffect(() => {
  }, [avatarUrl, user]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfileData();
    }
  }, [user, isLoading, navigate]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          gender: data.gender || "",
          phone: data.phone || "",
          address: data.address || "",
          countryCode: "+46",
        });
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFormChange = (updates: Partial<ProfileFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const geocodeAddress = async (address: string): Promise<string | null> => {
    if (!address) return null;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      if (!tokenData?.token) return null;
      const encoded = encodeURIComponent(address);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${tokenData.token}&country=SE&limit=1`
      );
      const json = await res.json();
      if (json.features?.length > 0) {
        const [lng, lat] = json.features[0].center;
        return `(${lng},${lat})`;
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");

      // Geocode address to get coordinates
      const location = await geocodeAddress(formData.address);
      
      const updateData: any = {
  first_name: formData.firstName,
  last_name: formData.lastName,
  gender: formData.gender || null,
  phone: formData.phone || null,
  address: formData.address || null,
};

// Only update location if geocoding succeeded
if (location) {
  updateData.location = location;
}

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t('common.save_changes'),
        description: t('profile.profile_updated'),
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t('common.error'),
        description: t('common.action_failed'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8 flex flex-col items-center">
          <AlertCircle className="text-amber-500 h-10 w-10 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('auth.authentication_required')}</h2>
          <p className="text-muted-foreground">{t('auth.please_log_in')}</p>
        </Card>
      </div>
    );
  }

  const currentAvatarUrl = avatarUrl || (user as any).avatar_url;
  
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('profile.edit_profile')}</h1>
      
      <div className="mb-6 flex justify-center">
        <AvatarUpload 
          avatarUrl={currentAvatarUrl} 
          onFileChange={setAvatar} 
        />
      </div>
      
      <ProfileForm formData={formData} onChange={handleFormChange} />
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || avatarLoading}
          className="w-full sm:w-auto"
        >
          {isSubmitting || avatarLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            t('common.save_changes')
          )}
        </Button>
      </div>
    </div>
  );
}

export default ProfileEdit;
