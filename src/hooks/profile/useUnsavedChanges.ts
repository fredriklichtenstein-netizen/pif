
import { useState, useEffect } from "react";
import { ProfileFormData } from "./types";

/**
 * Hook to track unsaved changes in profile form
 */
export const useUnsavedChanges = (
  formData: ProfileFormData,
  initialFormData: ProfileFormData
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    try {
      // Custom comparison function for dates
      const areEqual = (a: ProfileFormData, b: ProfileFormData): boolean => {
        // Compare simple properties
        if (a.firstName !== b.firstName ||
            a.lastName !== b.lastName ||
            a.gender !== b.gender ||
            a.phone !== b.phone ||
            a.address !== b.address ||
            a.countryCode !== b.countryCode) {
          return false;
        }
        
        // Handle date comparison specially
        const aDate = a.dateOfBirth instanceof Date && !isNaN(a.dateOfBirth.getTime()) ? a.dateOfBirth : null;
        const bDate = b.dateOfBirth instanceof Date && !isNaN(b.dateOfBirth.getTime()) ? b.dateOfBirth : null;
        
        // If both dates are null/undefined, they're equal
        if (!aDate && !bDate) return true;
        // If only one is null/undefined, they're not equal
        if (!aDate || !bDate) return false;
        
        // Compare year, month, and day (ignore time)
        return (
          aDate.getFullYear() === bDate.getFullYear() &&
          aDate.getMonth() === bDate.getMonth() &&
          aDate.getDate() === bDate.getDate()
        );
      };
      
      const hasChanges = !areEqual(formData, initialFormData);
      console.log("Checking for unsaved changes:", { hasChanges });
      setHasUnsavedChanges(hasChanges);
    } catch (e) {
      console.error("Error comparing form data:", e);
      setHasUnsavedChanges(false);
    }
  }, [formData, initialFormData]);

  return { hasUnsavedChanges };
};
