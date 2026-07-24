
import { Card, CardContent } from "@/components/ui/card";
import { AddressInput } from "./address/AddressInput";
import { PhoneInput } from "./PhoneInput";
import { NameFields } from "@/components/forms/fields/NameFields";
import { Label } from "@/components/ui/label";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PickupPreferencesFields } from "./PickupPreferencesFields";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth?: Date;
  countryCode: string;
  pickupPreference?: 'meetup' | 'leave_at_door' | '';
  pickupAddress?: string;
  pickupAddressMode?: 'primary' | 'custom';
  pickupDoorCode?: string;
  pickupFloor?: string;
  pickupInstructions?: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
}

export function ProfileForm({ formData, onChange }: ProfileFormProps) {
  const { t } = useTranslation();
  const handleChange = (updates: Partial<ProfileFormData>) => {
    onChange({
      ...formData,
      ...updates
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <NameFields
              firstName={formData.firstName}
              lastName={formData.lastName}
              onFirstNameChange={(firstName) => handleChange({ firstName })}
              onLastNameChange={(lastName) => handleChange({ lastName })}
            />

            <div className="space-y-2">
              <Label>{t('profile.mobile_phone')}</Label>
              <PhoneInput
                value={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone, countryCode) =>
                  handleChange({ phone, countryCode })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('profile.primary_address')}</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => handleChange({ address })}
                mapButtonLabel={<Map className="w-4 h-4" />}
                hideSearch
              />
            </div>

            <PickupPreferencesFields
              primaryAddress={formData.address}
              formData={formData}
              onChange={(patch) => handleChange(patch)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
