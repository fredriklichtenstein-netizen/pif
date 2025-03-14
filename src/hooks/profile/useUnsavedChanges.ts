
import { useState, useEffect } from "react";
import { ProfileFormData } from "./types";

/**
 * Hook to track unsaved changes in profile data
 */
export const useUnsavedChanges = (
  currentData: ProfileFormData,
  initialData: ProfileFormData
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const compareValues = () => {
      try {
        // Compare primitive values
        if (
          currentData.firstName !== initialData.firstName ||
          currentData.lastName !== initialData.lastName ||
          currentData.gender !== initialData.gender ||
          currentData.phone !== initialData.phone ||
          currentData.address !== initialData.address ||
          currentData.countryCode !== initialData.countryCode
        ) {
          return true;
        }

        // Compare date of birth (could be undefined, null, or Date object)
        const currentDate = currentData.dateOfBirth;
        const initialDate = initialData.dateOfBirth;
        
        // If both are null/undefined, they're equal
        if (!currentDate && !initialDate) {
          return false;
        }
        
        // If only one is null/undefined, they're different
        if (!currentDate || !initialDate) {
          return true;
        }
        
        // If both are dates, compare year, month, and day
        if (
          currentDate instanceof Date &&
          initialDate instanceof Date &&
          !isNaN(currentDate.getTime()) &&
          !isNaN(initialDate.getTime())
        ) {
          return (
            currentDate.getFullYear() !== initialDate.getFullYear() ||
            currentDate.getMonth() !== initialDate.getMonth() ||
            currentDate.getDate() !== initialDate.getDate()
          );
        }
        
        // If we reach here, they are different types or invalid dates
        return true;
      } catch (error) {
        console.error("Error comparing profile data:", error);
        return false;
      }
    };

    setHasUnsavedChanges(compareValues());
  }, [currentData, initialData]);

  return { hasUnsavedChanges };
};
