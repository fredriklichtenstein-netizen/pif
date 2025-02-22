
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string, countryCode: string) => void;
  required?: boolean;
}

const countryCodes = [
  { code: "+46", country: "Sweden" },
  { code: "+45", country: "Denmark" },
  { code: "+47", country: "Norway" },
  { code: "+358", country: "Finland" },
];

export function PhoneInput({ value, countryCode, onPhoneChange, required }: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={countryCode}
        onValueChange={(code) => onPhoneChange(value, code)}
        required={required}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Country code" />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.code} ({country.country})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={value}
        onChange={(e) => onPhoneChange(e.target.value, countryCode)}
        placeholder="Phone number"
        required={required}
        className="flex-1"
      />
    </div>
  );
}
