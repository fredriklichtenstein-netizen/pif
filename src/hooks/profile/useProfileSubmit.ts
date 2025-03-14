
import { useState } from "react";
import { ProfileFormData } from "./types";

/**
 * Hook for handling profile form submission
 */
export const useProfileSubmit = (saveProfile: () => Promise<boolean>) => {
  const [submitting, setSubmitting] = useState(false);

  /**
   * Handle profile form submission
   * @param {React.FormEvent} e - Form event
   * @returns {Promise<boolean>} Success status
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safe logging of form data is handled by the caller
    console.log("useProfileSubmit: Form submitted");
    
    setSubmitting(true);
    try {
      const result = await saveProfile();
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    handleSubmit
  };
};
