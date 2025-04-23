
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export const useProfileAvatar = () => {
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Initialize avatarUrl from user data when component mounts
  useEffect(() => {
    if (user && (user as any).avatar_url) {
      setAvatarUrl((user as any).avatar_url);
      console.log("Initialized avatarUrl from user:", (user as any).avatar_url);
    }
  }, [user]);

  const handleAvatarUpdate = async (file: File) => {
    if (!file) return;
    
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log("Uploading avatar:", fileName);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      console.log("Avatar uploaded successfully, public URL:", publicUrl);
      
      // Update the UI immediately with the new avatar URL
      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log("Profile updated with new avatar_url");

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
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
    avatarUrl,
    setAvatar: (file: File | null) => {
      setAvatar(file);
      if (file) {
        handleAvatarUpdate(file);
      }
    },
    setAvatarUrl
  };
};
