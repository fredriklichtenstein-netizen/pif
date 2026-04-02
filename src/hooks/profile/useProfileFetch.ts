
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useTranslation } from "react-i18next";

const profileCache = new Map<string, {
  data: ProfileFormData;
  timestamp: number;
  avatarUrl: string | null;
}>();
const CACHE_TTL = 5 * 60 * 1000;

export const useProfileFetch = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useGlobalAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "", lastName: "", gender: "", phone: "", address: "", countryCode: "+46",
  });
  const [initialFormData, setInitialFormData] = useState({ ...formData });
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const fetchAttempts = useRef<number>(0);
  const maxFetchAttempts = 3;

  const fetchProfile = async () => {
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setError(new Error(t('interactions.must_sign_in_profile')));
      }
      return;
    }

    const cachedProfile = profileCache.get(user.id);
    const now = Date.now();
    if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_TTL) {
      setFormData(cachedProfile.data);
      setInitialFormData(cachedProfile.data);
      setAvatarUrl(cachedProfile.avatarUrl);
      return;
    }

    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();
    if (!cachedProfile) setLoading(true);
    setError(null);
    
    try {
      const timeoutMs = 8000 + (fetchAttempts.current * 2000);
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort();
        }
      }, timeoutMs);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', user.id)
        .abortSignal(abortController.current.signal).single();
      
      clearTimeout(timeoutId);

      if (profileError) { console.error("Error fetching profile:", profileError); throw profileError; }

      if (profile) {
        fetchAttempts.current = 0;
        let dateOfBirth: Date | undefined = undefined;
        if (profile.date_of_birth) {
          dateOfBirth = new Date(profile.date_of_birth);
          if (isNaN(dateOfBirth.getTime())) dateOfBirth = undefined;
        }
        const newFormData = {
          firstName: profile.first_name || "", lastName: profile.last_name || "",
          gender: profile.gender || "", phone: profile.phone || "",
          address: profile.address || "", countryCode: "+46", dateOfBirth,
        };
        profileCache.set(user.id, { data: newFormData, timestamp: now, avatarUrl: profile.avatar_url });
        setFormData(newFormData);
        setInitialFormData(newFormData);
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (fetchAttempts.current < maxFetchAttempts - 1) {
          fetchAttempts.current++;
          const backoffDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 10000);
          setTimeout(() => { fetchProfile(); }, backoffDelay);
        } else {
          console.error("Max profile fetch attempts reached");
          fetchAttempts.current = 0;
          setError(new Error(t('interactions.profile_load_error')));
          toast({ title: t('interactions.error_title'), description: t('interactions.profile_load_error'), variant: "destructive" });
        }
        return;
      }
      console.error("Error fetching profile:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      toast({ title: t('interactions.error_title'), description: t('interactions.profile_load_failed', { error: error.message || 'Unknown error' }), variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { return () => { if (abortController.current) abortController.current.abort(); }; }, []);
  useEffect(() => { if (user) fetchProfile(); }, [user]);
  
  const clearCache = () => { if (user) profileCache.delete(user.id); };

  return { loading, formData, initialFormData, avatarUrl, error, setFormData, setInitialFormData, fetchProfile, clearCache };
};
