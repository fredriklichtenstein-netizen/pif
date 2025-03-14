
/**
 * Interface representing the form data for user profile
 * @interface ProfileFormData
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} gender - User's gender
 * @property {string} phone - User's phone number
 * @property {string} address - User's primary address
 * @property {string} countryCode - User's country code for phone number
 * @property {Date} [dateOfBirth] - Optional date of birth
 */
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  countryCode: string;
  dateOfBirth?: Date;
}
