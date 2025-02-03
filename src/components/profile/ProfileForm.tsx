import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormData {
  fullName: string;
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
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          required
        />
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
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => onChange({ address: e.target.value })}
          required
        />
      </div>
    </div>
  );
}