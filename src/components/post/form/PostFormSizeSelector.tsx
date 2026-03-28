
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface PostFormSizeSelectorProps {
  category: string;
  measurements: Record<string, string>;
  onSizeChange: (size: string) => void;
  onCustomSizeChange: (customSize: string) => void;
  itemType?: 'offer' | 'request';
}

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export function PostFormSizeSelector({
  category,
  measurements,
  onSizeChange,
  onCustomSizeChange,
  itemType = 'offer',
}: PostFormSizeSelectorProps) {
  const { t } = useTranslation();
  const isRequest = itemType === 'request';
  const isClothing = category?.toLowerCase().includes("clothing");
  const isShoes = category?.toLowerCase().includes("shoes");
  
  let sizes: string[] = [];
  let placeholder = isRequest ? t('interactions.desired_size') : t('interactions.select_size');
  
  if (isClothing) {
    sizes = CLOTHING_SIZES;
  } else if (isShoes) {
    sizes = SHOE_SIZES;
    placeholder = isRequest ? t('interactions.desired_shoe_size') : t('interactions.select_shoe_size');
  }

  if (sizes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isRequest ? t('interactions.size_desired') : t('interactions.size_label')}
        </Label>
        <Select 
          value={measurements.size || ""} 
          onValueChange={onSizeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {isRequest ? t('interactions.size_not_important') : t('interactions.select_size')}
            </SelectItem>
            {sizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
            <SelectItem value="custom">{t('interactions.custom_size')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {measurements.size === "custom" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isRequest ? t('interactions.describe_desired_size') : t('interactions.enter_size')}
          </Label>
          <Input
            value={measurements.customSize || ""}
            onChange={(e) => onCustomSizeChange(e.target.value)}
            placeholder={isRequest ? t('interactions.size_placeholder_request') : t('interactions.size_placeholder_offer')}
          />
        </div>
      )}
    </div>
  );
}
