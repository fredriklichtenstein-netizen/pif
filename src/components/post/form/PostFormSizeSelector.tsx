
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { getSizeOptionsForCategory } from "@/utils/categories";
import { useState } from "react";

// Jeans are sized in inches, waist (W) and inside-leg length (L). The pair is
// stored as the size itself ("W32 L34"), so the post shows it like any other
// size and nothing downstream needs to know about it.
const JEANS_WAISTS = Array.from({ length: 40 - 24 + 1 }, (_, i) => String(24 + i));
const JEANS_LENGTHS = Array.from({ length: 36 - 26 + 1 }, (_, i) => String(26 + i));
const JEANS_SIZE = /^(?=[WL]\d)(?:W(\d+))? ?(?:L(\d+))?$/;

interface PostFormSizeSelectorProps {
  category: string;
  measurements: Record<string, string>;
  onSizeChange: (size: string) => void;
  onCustomSizeChange: (customSize: string) => void;
  itemType?: 'offer' | 'request';
}

export function PostFormSizeSelector({
  category,
  measurements,
  onSizeChange,
  onCustomSizeChange,
  itemType = 'offer',
}: PostFormSizeSelectorProps) {
  const { t } = useTranslation();
  const isRequest = itemType === 'request';
  const { sizes, kind } = getSizeOptionsForCategory(category);
  const offerJeans = kind === 'adult_clothing';
  const size = measurements.size || "";
  const jeansMatch = offerJeans ? JEANS_SIZE.exec(size) : null;
  // "jeans" is picked but neither W nor L chosen yet: nothing to store.
  const [jeansPicked, setJeansPicked] = useState(false);
  const isJeans = !!jeansMatch || (jeansPicked && size === "");
  const waist = jeansMatch?.[1] ?? "";
  const length = jeansMatch?.[2] ?? "";

  const setJeans = (w: string, l: string) =>
    onSizeChange([w && `W${w}`, l && `L${l}`].filter(Boolean).join(" "));

  const handleSelect = (value: string) => {
    if (value === "jeans") {
      setJeansPicked(true);
      onSizeChange("");
      return;
    }
    setJeansPicked(false);
    onSizeChange(value);
  };

  let placeholder = isRequest ? t('interactions.desired_size') : t('interactions.select_size');
  if (kind === 'shoes') {
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
          value={isJeans ? "jeans" : size}
          onValueChange={handleSelect}
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
            {offerJeans && (
              <SelectItem value="jeans">{t('interactions.jeans_size')}</SelectItem>
            )}
            <SelectItem value="custom">{t('interactions.custom_size')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isJeans && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('interactions.jeans_waist')}</Label>
            <Select value={waist} onValueChange={(w) => setJeans(w, length)}>
              <SelectTrigger>
                <SelectValue placeholder="W" />
              </SelectTrigger>
              <SelectContent>
                {JEANS_WAISTS.map((w) => (
                  <SelectItem key={w} value={w}>W{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('interactions.jeans_length')}</Label>
            <Select value={length} onValueChange={(l) => setJeans(waist, l)}>
              <SelectTrigger>
                <SelectValue placeholder="L" />
              </SelectTrigger>
              <SelectContent>
                {JEANS_LENGTHS.map((l) => (
                  <SelectItem key={l} value={l}>L{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
