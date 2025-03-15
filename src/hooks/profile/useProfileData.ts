
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";

export const useProfileData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    address: "",
    countryCode: "+46",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        // Properly parse date of birth if it exists
        let dateOfBirth: Date | undefined = undefined;
        if (profile.date_of_birth) {
          dateOfBirth = new Date(profile.date_of_birth);
          // Ensure it's a valid date
          if (isNaN(dateOfBirth.getTime())) {
            dateOfBirth = undefined;
          }
        }
        
        setFormData({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46", // Default country code if not stored
          dateOfBirth: dateOfBirth,
        });
        setInitialFormData({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46",
          dateOfBirth: dateOfBirth,
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

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    setFormData,
    setInitialFormData
  };
};
