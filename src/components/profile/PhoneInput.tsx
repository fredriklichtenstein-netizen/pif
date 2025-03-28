
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
  disabled?: boolean; // Add the disabled prop
}

const countryCodes = [
  { code: "+46", country: "Sweden" },
  { code: "+45", country: "Denmark" },
  { code: "+47", country: "Norway" },
  { code: "+358", country: "Finland" },
];

export function PhoneInput({ value, countryCode, onPhoneChange, required, disabled }: PhoneInputProps) {
  // Handle phone number input change
  const handlePhoneChange = (newPhone: string) => {
    // If the phone number starts with a leading zero, remove it
    if (newPhone.startsWith('0')) {
      newPhone = newPhone.substring(1);
    }
    onPhoneChange(newPhone, countryCode);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={countryCode}
        onValueChange={(code) => onPhoneChange(value, code)}
        required={required}
        disabled={disabled}
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
        onChange={(e) => handlePhoneChange(e.target.value)}
        placeholder="Phone number"
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
