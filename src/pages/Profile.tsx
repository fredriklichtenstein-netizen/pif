import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";

const Profile = () => {
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
    countryCode: "+46", // Adding default country code for Sweden
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (avatar) {
      handleProfileUpdate();
    }
  }, [avatar]);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setFormData({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46", // Default to Swedish country code if not set
        });
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (file: File) => {
    setAvatar(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleProfileUpdate = async () => {
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      let avatarPath = avatarUrl;
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, avatar);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        avatarPath = publicUrl;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: avatarPath,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Update your profile information
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
            {loading ? "Updating profile..." : "Update profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
