
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const isRequest = itemType === 'request';
  const isClothing = category?.toLowerCase().includes("clothing");
  const isShoes = category?.toLowerCase().includes("shoes");
  
  let sizes: string[] = [];
  let placeholder = isRequest ? "Önskad storlek" : "Välj storlek";
  
  if (isClothing) {
    sizes = CLOTHING_SIZES;
  } else if (isShoes) {
    sizes = SHOE_SIZES;
    placeholder = isRequest ? "Önskad skostorlek" : "Välj skostorlek";
  }

  if (sizes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isRequest ? "Önskad storlek" : "Storlek"}
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
              {isRequest ? "Storlek ej viktig" : "Välj storlek"}
            </SelectItem>
            {sizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
            <SelectItem value="custom">Anpassad storlek</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {measurements.size === "custom" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isRequest ? "Beskriv önskad storlek" : "Ange storlek"}
          </Label>
          <Input
            value={measurements.customSize || ""}
            onChange={(e) => onCustomSizeChange(e.target.value)}
            placeholder={isRequest ? "t.ex. Medium till Large" : "t.ex. 42/44"}
          />
        </div>
      )}
    </div>
  );
}
