import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function CreateProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    phone: "",
    address: "",
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let avatarPath = null;
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        avatarPath = publicUrl;
      }

      // First update the profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          avatar_url: avatarPath,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Then set onboarding_completed to true in a separate update
      // This ensures all profile data is saved before marking onboarding as complete
      const { error: onboardingError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (onboardingError) throw onboardingError;

      toast({
        title: "Profile created!",
        description: "Your profile has been created successfully.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error("Profile creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Create your profile
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Let's get to know you better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AvatarUpload 
            avatarUrl={avatarUrl}
            onFileChange={handleFileChange}
          />

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