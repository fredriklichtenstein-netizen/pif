
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const genderKeys = [
  { value: "female", labelKey: "profile.gender_female" },
  { value: "male", labelKey: "profile.gender_male" },
  { value: "transgender", labelKey: "profile.gender_transgender" },
  { value: "non_binary", labelKey: "profile.gender_non_binary" },
  { value: "other", labelKey: "profile.gender_other" },
  { value: "prefer_not_to_say", labelKey: "profile.gender_prefer_not_to_say" },
];

export function GenderSelector({ value, onChange, required }: GenderSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <div>
      <Label htmlFor="gender">{t('profile.gender')}</Label>
      <Select
        value={value}
        onValueChange={onChange}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('profile.select_gender')} />
        </SelectTrigger>
        <SelectContent>
          {genderKeys.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
