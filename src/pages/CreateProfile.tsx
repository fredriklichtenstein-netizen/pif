
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateProfile() {
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

      // Generate a username from the email if not already set
      const username = user.email ? user.email.split('@')[0] : `user_${Date.now()}`;

      console.log("Updating profile with username:", username);
      
      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          avatar_url: avatarPath,
          onboarding_completed: true
        })
        .select();

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      console.log("Profile created successfully:", profileData);

      toast({
        title: "Profile created!",
        description: "Your profile has been created successfully.",
      });

      // Add a small delay before navigation to ensure the toast is visible
      setTimeout(() => {
        navigate("/profile");
      }, 1000);

    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast({
        title: "Error creating profile",
        description: error.message || "An unexpected error occurred",
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
              <AvatarUpload 
                avatarUrl={avatarUrl}
                onFileChange={handleFileChange}
              />
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
