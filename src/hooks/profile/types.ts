
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  countryCode: string;
  dateOfBirth?: Date;
  pickupPreference?: 'meetup' | 'leave_at_door' | '';
  pickupAddress?: string;
}
