
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

export default function CreateProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    countryCode: "+46", // Default to Sweden
    address: "",
    dateOfBirth: undefined as Date | undefined,
  });

  const handleFileChange = (file: File) => {
    setAvatar(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      let avatarPath = null;
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        console.log("Uploading avatar...");
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, avatar);

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          throw uploadError;
        }

        console.log("Avatar uploaded successfully:", uploadData);
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        avatarPath = publicUrl;
        console.log("Avatar public URL:", avatarPath);
      }

      const username = user.email ? user.email.split('@')[0] : `user_${Date.now()}`;

      // Prepare profile data with proper date formatting
      const profileData = {
        id: user.id,
        username: username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        phone: formData.countryCode + formData.phone,
        address: formData.address,
        avatar_url: avatarPath,
        date_of_birth: formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : null,
        onboarding_completed: true
      };

      const { data: createdProfile, error: updateError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select();

      if (updateError) throw updateError;

      // Update global auth state so PrivateRoute won't redirect back
      useGlobalAuth.getState().setProfileCompleted(true);

      toast({
        title: t('profile.created'),
        description: t('profile.created_description'),
      });

      setTimeout(() => {
        navigate("/profile");
      }, 1000);

    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast({
        title: t('profile.create_error'),
        description: error.message || t('profile.unexpected_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your profile
          </h1>
          <p className="mt-2 text-gray-600">
            Help others get to know you better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <AvatarUpload 
                      avatarUrl={avatarUrl}
                      onFileChange={handleFileChange}
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  {avatarUrl && (
                    <div className="relative w-full aspect-square">
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <ProfileForm 
            formData={formData}
            onChange={handleFormChange}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating profile..." : "Create profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
