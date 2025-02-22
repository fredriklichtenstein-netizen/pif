
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const genderOptions = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "transgender", label: "Transgender" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function GenderSelector({ value, onChange, required }: GenderSelectorProps) {
  return (
    <div>
      <Label htmlFor="gender">Gender</Label>
      <Select
        value={value}
        onValueChange={onChange}
        required={required}
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
  );
}
