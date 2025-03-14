
import { ProfileFormData } from "../types";

/**
 * Parses date of birth from database format
 * @param {string} dateString - Database date string
 * @returns {Date | undefined} JavaScript Date object or undefined
 */
export const parseDateOfBirth = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  
  console.log("Raw date_of_birth from database:", dateString);
  try {
    // Create a new date with the specific format to avoid timezone issues
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2], 10);
      
      const dateOfBirth = new Date(year, month, day);
      
      // Ensure it's a valid date
      if (isNaN(dateOfBirth.getTime())) {
        console.error("Invalid date format received:", dateString);
        return undefined;
      } else {
        console.log("Parsed dateOfBirth:", dateOfBirth);
        return dateOfBirth;
      }
    }
  } catch (error) {
    console.error("Error parsing date:", error);
  }
  return undefined;
};

/**
 * Formats date of birth for database storage
 * @param {Date} date - JavaScript Date object
 * @returns {string | null} Database formatted date string or null
 */
export const formatDateForDatabase = (date?: Date): string | null => {
  if (!date) return null;
  
  try {
    // Ensure we have a valid date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      // Format as YYYY-MM-DD for PostgreSQL date type
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 as JS months are 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log("Formatted date for database storage:", formattedDate);
      return formattedDate;
    } else {
      console.error("Invalid date object:", date);
    }
  } catch (error) {
    console.error("Error formatting date:", error);
  }
  return null;
};

/**
 * Extracts country code from phone number
 * @param {string} phone - Full phone number with country code
 * @returns {object} Separated country code and phone number
 */
export const extractPhoneComponents = (phone?: string): { countryCode: string, phoneNumber: string } => {
  const defaultResult = { countryCode: "+46", phoneNumber: "" };
  
  if (!phone) return defaultResult;
  
  // Check if phone number contains a country code (starts with +)
  if (phone.startsWith('+')) {
    const match = phone.match(/^\+(\d+)/);
    if (match && match[0]) {
      const countryCode = match[0];
      const phoneNumber = phone.substring(match[0].length);
      return { countryCode, phoneNumber };
    }
  }
  
  return { ...defaultResult, phoneNumber: phone };
};

/**
 * Combines country code and phone number
 * @param {string} countryCode - Country code with + prefix
 * @param {string} phoneNumber - Phone number without country code
 * @returns {string} Combined full phone number
 */
export const combinePhoneComponents = (countryCode: string, phoneNumber: string): string => {
  // Only include country code if phone is not empty
  return phoneNumber ? `${countryCode}${phoneNumber}` : '';
};

/**
 * Parses profile data from database format to form data format
 * @param {any} profile - Profile data from database
 * @returns {object} Formatted profile data with avatar URL
 */
export const parseProfileFromDatabase = (profile: any) => {
  const dateOfBirth = parseDateOfBirth(profile.date_of_birth);
  const { countryCode, phoneNumber } = extractPhoneComponents(profile.phone);
  
  const profileData: ProfileFormData = {
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    gender: profile.gender || "",
    phone: phoneNumber,
    address: profile.address || "",
    countryCode: countryCode,
    dateOfBirth: dateOfBirth,
  };
  
  return {
    avatarUrl: profile.avatar_url,
    profileData
  };
};

/**
 * Formats profile data for database storage
 * @param {ProfileFormData} formData - Profile form data
 * @param {string} userId - User ID
 * @returns {object} Database formatted profile data
 */
export const formatProfileForDatabase = (formData: ProfileFormData, userId: string) => {
  // Format phone to remove leading zero
  let formattedPhone = formData.phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1);
  }

  // Combine country code and phone number
  const fullPhoneNumber = combinePhoneComponents(formData.countryCode, formattedPhone);

  // Format date of birth for database storage
  const formattedDateOfBirth = formatDateForDatabase(formData.dateOfBirth);

  return {
    id: userId,
    first_name: formData.firstName,
    last_name: formData.lastName,
    gender: formData.gender,
    phone: fullPhoneNumber,
    address: formData.address,
    date_of_birth: formattedDateOfBirth,
    updated_at: new Date().toISOString()
  };
};
