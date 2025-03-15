
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormData } from "./types";

export const useProfileSubmit = (
  formData: ProfileFormData,
  setInitialFormData: (data: ProfileFormData) => void
) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Format phone to remove leading zero
      let formattedPhone = formData.phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }

      // Format date of birth for database storage
      const formattedDateOfBirth = formData.dateOfBirth 
        ? formData.dateOfBirth.toISOString().split('T')[0] 
        : null;

      console.log("Saving date of birth:", formattedDateOfBirth);

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
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update the initial form data to reflect the current state
      setInitialFormData({ 
        ...formData,
        phone: formattedPhone
      });
      
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
    handleSubmit
  };
};
