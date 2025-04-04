
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

// Add a cache mechanism for profile data with a 5-minute TTL
const profileCache = new Map<string, {
  data: ProfileFormData;
  timestamp: number;
  avatarUrl: string | null;
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  const abortController = useRef<AbortController | null>(null);
  const fetchAttempts = useRef<number>(0);
  const maxFetchAttempts = 3;

  const fetchProfile = async () => {
    // Don't attempt to fetch if auth is still loading or user is not authenticated
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setError(new Error("You must be signed in to view your profile"));
      }
      return;
    }

    // Check cache first
    const cachedProfile = profileCache.get(user.id);
    const now = Date.now();
    if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_TTL) {
      console.log("Using cached profile data");
      setFormData(cachedProfile.data);
      setInitialFormData(cachedProfile.data);
      setAvatarUrl(cachedProfile.avatarUrl);
      return;
    }

    // Abort any in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create a new abort controller with a longer timeout for subsequent attempts
    abortController.current = new AbortController();
    
    // Don't show loading state for quick refreshes to avoid UI flicker
    if (!cachedProfile) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log(`Fetching profile for user ${user.id} (attempt ${fetchAttempts.current + 1}/${maxFetchAttempts})`);
      
      // Use a more reliable timeout mechanism
      const timeoutMs = 8000 + (fetchAttempts.current * 2000); // Increase timeout with each attempt
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          console.log(`Profile fetch timeout after ${timeoutMs}ms`);
          abortController.current.abort();
        }
      }, timeoutMs);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(abortController.current.signal)
        .single();
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      if (profile) {
        console.log("Profile data retrieved successfully");
        fetchAttempts.current = 0; // Reset attempts counter on success
        
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
        
        // Update cache
        profileCache.set(user.id, {
          data: newFormData,
          timestamp: now,
          avatarUrl: profile.avatar_url
        });
        
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error: any) {
      // Don't show error if request was aborted (which we might do deliberately)
      if (error.name === 'AbortError') {
        console.log('Profile fetch aborted');
        
        // Retry with exponential backoff, but only up to max attempts
        if (fetchAttempts.current < maxFetchAttempts - 1) {
          fetchAttempts.current++;
          const backoffDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 10000);
          console.log(`Retrying profile fetch in ${backoffDelay}ms (attempt ${fetchAttempts.current + 1}/${maxFetchAttempts})`);
          
          setTimeout(() => {
            fetchProfile();
          }, backoffDelay);
        } else {
          console.error("Max profile fetch attempts reached");
          fetchAttempts.current = 0; // Reset for next time
          setError(new Error("Failed to load profile after multiple attempts"));
          toast({
            title: "Error",
            description: "Could not load your profile. Please try again later.",
            variant: "destructive",
          });
        }
        return;
      }
      
      console.error("Error fetching profile:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Only show toast for non-aborted errors
      toast({
        title: "Error",
        description: "Failed to load profile: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Fetch profile on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  
  // Clear cache when profile is updated
  const clearCache = () => {
    if (user) {
      profileCache.delete(user.id);
    }
  };

  return {
    loading,
    formData,
    initialFormData,
    avatarUrl,
    error,
    setFormData,
    setInitialFormData,
    fetchProfile,
    clearCache
  };
};
