
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  countryCode: string;
  dateOfBirth?: Date;
}

export const useProfileManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });

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
          countryCode: "+46",
        });
        setInitialFormData({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46",
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

      setInitialFormData({ ...formData });
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

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setAvatar,
    setFormData,
    handleSubmit,
  };
};
