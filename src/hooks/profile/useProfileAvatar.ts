
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for managing profile avatar functionality
 * 
 * @returns Object containing avatar state and methods
 * @property {boolean} loading - Indicates if an avatar operation is in progress
 * @property {File|null} avatar - The avatar file being processed
 * @property {string|null} avatarUrl - URL of the current avatar
 * @property {Function} setAvatar - Set the avatar file
 * @property {Function} setAvatarUrl - Set the avatar URL directly
 * @property {Function} handleAvatarUpdate - Upload and update the avatar in storage and database
 */
export const useProfileAvatar = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  /**
   * Uploads the avatar to storage and updates the profile in the database
   * @returns {Promise<void>}
   */
  const handleAvatarUpdate = async () => {
    if (!avatar) return;
    
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, avatar);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
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
    avatar,
    avatarUrl,
    setAvatar,
    setAvatarUrl,
    handleAvatarUpdate
  };
};
