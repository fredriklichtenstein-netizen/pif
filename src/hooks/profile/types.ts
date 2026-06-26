
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  
  phone: string;
  address: string;
  countryCode: string;
  dateOfBirth?: Date;
  pickupPreference?: 'meetup' | 'leave_at_door' | '';
  pickupAddress?: string;
  pickupAddressMode?: 'primary' | 'custom';
  pickupDoorCode?: string;
  pickupFloor?: string;
  pickupInstructions?: string;
}
