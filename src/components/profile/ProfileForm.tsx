
import { Card, CardContent } from "@/components/ui/card";
import { AddressInput } from "./address/AddressInput";
import { PhoneInput } from "./PhoneInput";
import { NameFields } from "@/components/forms/fields/NameFields";
import { GenderSelector } from "@/components/forms/fields/GenderSelector";
import { DateOfBirthSelector } from "@/components/forms/fields/DateOfBirthSelector";
import { Label } from "@/components/ui/label";
import { Map } from "lucide-react";

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
  onChange: (data: ProfileFormData) => void;
}

export function ProfileForm({ formData, onChange }: ProfileFormProps) {
  // Log the formData to debug
  console.log("ProfileForm rendering with formData:", {
    ...formData,
    dateOfBirth: formData.dateOfBirth ? 
      `${formData.dateOfBirth.toISOString()} (valid: ${!isNaN(formData.dateOfBirth.getTime())})` : 
      undefined
  });

  const handleChange = (updates: Partial<ProfileFormData>) => {
    // Log what's being updated
    console.log("Updating form data with:", updates);
    onChange({
      ...formData,
      ...updates
    });
  };

  const handleDateOfBirthChange = (date: Date | undefined) => {
    console.log("Date of birth changed to:", date);
    handleChange({ dateOfBirth: date });
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
              <Label>Mobile phone (optional)</Label>
              <PhoneInput
                value={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone, countryCode) => 
                  handleChange({ phone, countryCode })
                }
              />
            </div>

            <DateOfBirthSelector
              dateOfBirth={formData.dateOfBirth}
              onChange={handleDateOfBirthChange}
            />

            <div className="space-y-2">
              <Label>Primary PIF address</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => handleChange({ address })}
                mapButtonLabel={<Map className="w-4 h-4" />}
                hideSearch
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
