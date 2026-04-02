
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export const useProfileAvatar = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Initialize avatarUrl from user data when component mounts
  useEffect(() => {
    if (!user) return;
    
    const fetchAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching avatar:", error);
          return;
        }
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error("Error fetching avatar:", err);
      }
    };
    
    fetchAvatar();
    
    // Set up real-time subscription for avatar changes
    const channel = supabase
      .channel('profile-avatar-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.avatar_url) {
          setAvatarUrl(payload.new.avatar_url);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

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
        title: t('interactions.avatar_updated'),
        description: t('interactions.avatar_updated_description'),
      });
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      toast({
        title: t('interactions.error_title'),
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
