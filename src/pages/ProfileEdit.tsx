
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

function ProfileEdit() {
  const { user, isLoading } = useGlobalAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46", // Default to Sweden
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { setAvatar, avatarUrl, loading: avatarLoading, setAvatarUrl } = useProfileAvatar();
  
  // Debug logging
  useEffect(() => {
    console.log("Current avatarUrl:", avatarUrl);
    console.log("User avatar_url:", (user as any)?.avatar_url);
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
      setProfileLoading(true);
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Set the avatar URL from the profile data
      if (data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }

      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        gender: data.gender || "",
        phone: data.phone || "",
        address: data.address || "",
        countryCode: data.phone?.startsWith("+") 
          ? data.phone.substring(0, data.phone.indexOf(" ")) || "+46"
          : "+46",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFormChange = (data: ProfileFormData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Skeleton className="w-full h-[70vh] rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8 flex flex-col items-center">
          <AlertCircle className="text-amber-500 h-10 w-10 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to edit your profile.</p>
        </Card>
      </div>
    );
  }

  // Determine which avatar URL to use
  const currentAvatarUrl = avatarUrl || (user as any).avatar_url;
  
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
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
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

export default ProfileEdit;
