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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }
      
      if (!user) {
        console.error("No user found");
        throw new Error("No user found");
      }

      console.log("Starting profile creation for user:", user.id);
      console.log("Form data to be saved:", formData);

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

      // First, check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing profile:", checkError);
        throw checkError;
      }

      if (!existingProfile) {
        console.error("No profile found for user:", user.id);
        throw new Error("Profile not found");
      }

      console.log("Existing profile found:", existingProfile);
      console.log("Updating profile data with:", {
        full_name: formData.fullName,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avatarPath,
      });

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          avatar_url: avatarPath,
          onboarding_completed: true
        })
        .eq('id', user.id)
        .select('*')
        .maybeSingle();

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      if (!profileData) {
        console.error("Profile update returned no data");
        throw new Error("Profile update failed");
      }

      console.log("Profile updated successfully:", profileData);

      toast({
        title: "Profile created!",
        description: "Your profile has been created successfully.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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