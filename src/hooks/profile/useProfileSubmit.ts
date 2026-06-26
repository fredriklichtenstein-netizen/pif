
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ProfileFormData } from "./types";

export const useProfileSubmit = (
  formData: ProfileFormData,
  setInitialFormData: (data: ProfileFormData) => void,
  clearCache?: () => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Format phone to remove leading zero
      let formattedPhone = formData.phone;
      if (formattedPhone && formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }

      // Format date of birth for database storage
      const formattedDateOfBirth = formData.dateOfBirth 
        ? formData.dateOfBirth.toISOString().split('T')[0] 
        : null;

      const floorParsed = formData.pickupFloor && formData.pickupFloor.trim() !== ''
        ? parseInt(formData.pickupFloor, 10)
        : null;
      const patch = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        address: formData.address,
        date_of_birth: formattedDateOfBirth,
        pickup_preference: formData.pickupPreference || null,
        pickup_address: formData.pickupAddressMode === 'custom'
          ? (formData.pickupAddress || null)
          : (formData.address || null),
        pickup_door_code: formData.pickupDoorCode || null,
        pickup_floor: Number.isFinite(floorParsed as number) ? floorParsed : null,
        pickup_instructions: formData.pickupInstructions || null,
        updated_at: new Date().toISOString(),
      } as any;

      // Optimistically update the cached profile so name/avatar appear instantly
      const { updateCachedProfile } = await import("@/hooks/profile/useCachedProfile");
      updateCachedProfile(user.id, patch);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .abortSignal(abortController.signal);

      if (updateError) throw updateError;

      // Update the initial form data to reflect the current state
      const updatedFormData = { 
        ...formData,
        phone: formattedPhone
      };
      
      setInitialFormData(updatedFormData);
      
      // Clear the cache if function is provided
      if (clearCache) {
        clearCache();
      }
      
      toast({
        title: t('interactions.profile_updated'),
        description: t('interactions.profile_updated_description'),
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      // Handle timeout errors nicely
      if (error.name === 'AbortError') {
        setSubmitError(new Error(t('interactions.profile_update_timeout')));
        toast({
          title: t('interactions.error_title'),
          description: t('interactions.profile_update_timeout'),
          variant: "destructive",
        });
      } else {
        setSubmitError(error);
        toast({
          title: t('interactions.error_title'),
          description: error.message || t('interactions.profile_update_error'),
          variant: "destructive",
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return {
    loading,
    error: submitError,
    handleSubmit
  };
};
