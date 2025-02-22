
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressInput } from "./AddressInput";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

const genderOptions = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "transgender", label: "Transgender" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function ProfileForm({ formData, onChange }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => onChange({ gender: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Home address</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => onChange({ address })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
