
import { ProfileFormData } from "../types";

/**
 * Parses a profile from the database into the format used by the application
 * 
 * @param profile - Database profile object
 * @returns Parsed profile data and avatar URL
 */
export const parseProfileFromDatabase = (profile: any) => {
  // Log the raw date to debug
  console.log("Raw date_of_birth from database:", profile.date_of_birth);
  
  // Safely parse date of birth
  let dateOfBirth: Date | undefined = undefined;
  
  if (profile.date_of_birth) {
    try {
      // Parse date string in YYYY-MM-DD format
      const [year, month, day] = profile.date_of_birth.split('-').map(Number);
      
      // Create date with explicit year, month (0-indexed), and day
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        dateOfBirth = new Date(year, month - 1, day);
        
        // Verify the date is valid
        if (isNaN(dateOfBirth.getTime())) {
          console.warn("Created an invalid date from:", profile.date_of_birth);
          dateOfBirth = undefined;
        } else {
          console.log("Parsed dateOfBirth:", {
            _type: "Date",
            value: {
              iso: dateOfBirth.toISOString(),
              value: dateOfBirth.getTime(),
              local: dateOfBirth.toString()
            }
          });
        }
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      dateOfBirth = undefined;
    }
  }

  // Create the profile data object
  const profileData: ProfileFormData = {
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    gender: profile.gender || "",
    phone: profile.phone || "",
    address: profile.address || "",
    dateOfBirth,
    countryCode: "+46", // Default to Sweden
  };

  return {
    profileData,
    avatarUrl: profile.avatar_url || null
  };
};

/**
 * Prepares profile data for saving to the database
 * 
 * @param formData - Profile form data
 * @returns Object ready for database insertion
 */
export const prepareProfileForSaving = (formData: ProfileFormData) => {
  let dateOfBirthString: string | null = null;
  
  // Format date of birth for database
  if (formData.dateOfBirth instanceof Date && !isNaN(formData.dateOfBirth.getTime())) {
    try {
      const year = formData.dateOfBirth.getFullYear();
      // Month is 0-indexed in JS Date, so add 1 and pad with 0 if needed
      const month = String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0');
      const day = String(formData.dateOfBirth.getDate()).padStart(2, '0');
      
      dateOfBirthString = `${year}-${month}-${day}`;
      console.log("Formatted date for database:", dateOfBirthString);
    } catch (error) {
      console.error("Error formatting date for database:", error);
    }
  }

  return {
    first_name: formData.firstName,
    last_name: formData.lastName,
    gender: formData.gender,
    phone: formData.phone,
    address: formData.address,
    date_of_birth: dateOfBirthString,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };
};
