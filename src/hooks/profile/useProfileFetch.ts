
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export const useProfileFetch = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [loading, setLoading] = useState(false);
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
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    // Don't attempt to fetch if auth is still loading or user is not authenticated
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setError(new Error("You must be signed in to view your profile"));
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching profile for user:", user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (profile) {
        console.log("Profile data retrieved:", profile);
        
        // Properly parse date of birth if it exists
        let dateOfBirth: Date | undefined = undefined;
        if (profile.date_of_birth) {
          dateOfBirth = new Date(profile.date_of_birth);
          // Ensure it's a valid date
          if (isNaN(dateOfBirth.getTime())) {
            dateOfBirth = undefined;
          }
        }
        
        const newFormData = {
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          address: profile.address || "",
          countryCode: "+46", // Default country code if not stored
          dateOfBirth: dateOfBirth,
        };
        
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setError(error);
      toast({
        title: "Error",
        description: "Failed to load profile: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on mount or when user changes
  useEffect(() => {
    fetchProfile();
  }, [user, authLoading]);

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error,
    setFormData,
    setInitialFormData,
    fetchProfile
  };
};
