
import { Card, CardContent } from "@/components/ui/card";
import { AddressInput } from "./address/AddressInput";
import { PhoneInput } from "./PhoneInput";
import { NameFields } from "@/components/forms/fields/NameFields";
import { GenderSelector } from "@/components/forms/fields/GenderSelector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  dateOfBirth?: Date;
  countryCode: string;
  pickupPreference?: 'meetup' | 'leave_at_door' | '';
  pickupAddress?: string;
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

            <GenderSelector
              value={formData.gender}
              onChange={(gender) => handleChange({ gender })}
              required
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

            <div className="space-y-2 pt-2">
              <Label>{t('profile.pickup_preference')}</Label>
              <RadioGroup
                value={formData.pickupPreference || ''}
                onValueChange={(value) =>
                  handleChange({ pickupPreference: value as 'meetup' | 'leave_at_door' })
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="meetup" id="pp-meetup" />
                  <Label htmlFor="pp-meetup" className="font-normal cursor-pointer">
                    {t('profile.pickup_meetup')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="leave_at_door" id="pp-leave" />
                  <Label htmlFor="pp-leave" className="font-normal cursor-pointer">
                    {t('profile.pickup_leave_at_door')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.pickupPreference === 'leave_at_door' && (
              <div className="space-y-2">
                <Label htmlFor="pickup-address">{t('profile.pickup_address')}</Label>
                <Input
                  id="pickup-address"
                  value={formData.pickupAddress || ''}
                  onChange={(e) => handleChange({ pickupAddress: e.target.value })}
                  placeholder={t('profile.pickup_address_placeholder')}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
