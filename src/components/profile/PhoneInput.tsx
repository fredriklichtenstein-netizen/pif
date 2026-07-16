
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { COUNTRY_CODES } from "@/utils/countryCodes";

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string, countryCode: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInput({ value, countryCode, onPhoneChange, required, disabled }: PhoneInputProps) {
  const { t } = useTranslation();
  
  const handlePhoneChange = (newPhone: string) => {
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
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('interactions.country_code')} />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
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
        placeholder={t('interactions.phone_number')}
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
