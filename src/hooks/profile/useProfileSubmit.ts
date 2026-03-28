
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          phone: formattedPhone,
          address: formData.address,
          date_of_birth: formattedDateOfBirth,
          updated_at: new Date().toISOString()
        })
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
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      // Handle timeout errors nicely
      if (error.name === 'AbortError') {
        setSubmitError(new Error("The request timed out. Please try again."));
        toast({
          title: "Error",
          description: "The request timed out. Please try again.",
          variant: "destructive",
        });
      } else {
        setSubmitError(error);
        toast({
          title: "Error",
          description: error.message || "An error occurred while updating your profile",
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
