
import { Card, CardContent } from "@/components/ui/card";
import { AddressInput } from "./address/AddressInput";
import { PhoneInput } from "./PhoneInput";
import { NameFields } from "./form/NameFields";
import { GenderSelector } from "./form/GenderSelector";
import { DateOfBirthSelector } from "./form/DateOfBirthSelector";
import { Label } from "@/components/ui/label";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  dateOfBirth?: Date;
  countryCode: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

export function ProfileForm({ formData, onChange }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <NameFields
              firstName={formData.firstName}
              lastName={formData.lastName}
              onFirstNameChange={(firstName) => onChange({ firstName })}
              onLastNameChange={(lastName) => onChange({ lastName })}
            />

            <GenderSelector
              value={formData.gender}
              onChange={(gender) => onChange({ gender })}
              required
            />

            <div className="space-y-2">
              <Label>Mobile phone</Label>
              <PhoneInput
                value={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone, countryCode) => 
                  onChange({ phone, countryCode })
                }
                required
              />
            </div>

            <DateOfBirthSelector
              dateOfBirth={formData.dateOfBirth}
              onChange={(dateOfBirth) => onChange({ dateOfBirth })}
            />

            <div className="space-y-2">
              <Label>Main PIF address</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => onChange({ address })}
                mapButtonLabel={<MapIcon className="w-4 h-4" />}
                hideSearch
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
