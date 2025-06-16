
import { Input } from "@/components/ui/input";
import { PostFormSizeSelector } from "./PostFormSizeSelector";
import { Label } from "@/components/ui/label";
import { Weight } from "lucide-react";

interface PostFormMeasurementsProps {
  category: string;
  measurements: Record<string, string>;
  onMeasurementChange: (field: string, value: string) => void;
  itemType?: 'offer' | 'request';
}

const CATEGORY_MEASUREMENTS: { [key: string]: string[] } = {
  "Clothing": ["Chest", "Length", "Shoulders", "Sleeves"],
  "Shoes": ["EU Size", "US Size", "UK Size", "Insole Length"],
  "Children's Clothing": ["Age", "Height", "Chest", "Length"],
  "Furniture": ["Width", "Depth", "Height"],
};

export function PostFormMeasurements({
  category,
  measurements,
  onMeasurementChange,
  itemType = 'offer',
}: PostFormMeasurementsProps) {
  // Only show weight for offers, not requests
  const showWeightField = itemType === 'offer';
  
  const handleSizeChange = (size: string) => {
    // If size is "none", set it to empty string for data storage purposes
    onMeasurementChange("size", size === "none" ? "" : size);
  };
  
  const handleCustomSizeChange = (customSize: string) => {
    onMeasurementChange("customSize", customSize);
    
    // If custom size is provided and standard size is not, use custom size as the main size
    if (customSize && (!measurements.size || measurements.size === "none")) {
      onMeasurementChange("size", customSize);
    }
  };

  const isRequest = itemType === 'request';

  const getTitle = () => {
    return isRequest ? "Preferenser" : "Mått och detaljer";
  };

  const getDescription = () => {
    if (isRequest) {
      return "Ange eventuella preferenser för storlek eller andra viktiga detaljer som kan hjälpa andra att förstå vad du söker.";
    }
    return "Lägg till mått och tekniska detaljer för att hjälpa intresserade att förstå varan bättre.";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-medium">{getTitle()}</Label>
        <p className="text-sm text-muted-foreground">
          {getDescription()}
        </p>
      </div>

      {category?.toLowerCase().includes("clothing") && (
        <PostFormSizeSelector 
          category={category} 
          measurements={measurements} 
          onSizeChange={handleSizeChange}
          onCustomSizeChange={handleCustomSizeChange}
          itemType={itemType}
        />
      )}
      
      {/* For offers: show detailed measurements if category has them */}
      {!isRequest && category && CATEGORY_MEASUREMENTS[category] && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Detaljerade mått</Label>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORY_MEASUREMENTS[category].map((field) => (
              <div key={field} className="space-y-2">
                <Label className="text-sm text-gray-600">{field}</Label>
                <Input
                  value={measurements[field] || ""}
                  onChange={(e) => onMeasurementChange(field, e.target.value)}
                  placeholder={field}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For requests: show a simplified preference field */}
      {isRequest && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Övriga preferenser</Label>
          <Input
            value={measurements.preferences || ""}
            onChange={(e) => onMeasurementChange("preferences", e.target.value)}
            placeholder="t.ex. 'Helst i röd färg', 'Måste vara barnvänlig'"
          />
          <p className="text-xs text-muted-foreground">
            Frivilligt - beskriv eventuella specifika önskemål
          </p>
        </div>
      )}
      
      {/* Only show weight for offers */}
      {showWeightField && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium">Vikt</Label>
          </div>
          <Input
            value={measurements.weight || ""}
            onChange={(e) => onMeasurementChange("weight", e.target.value)}
            placeholder="t.ex. 5 kg"
            className="max-w-[200px]"
          />
        </div>
      )}

      {/* Information boxes */}
      {isRequest ? (
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          <p><strong>💡 Tips:</strong> Du behöver inte fylla i alla detaljer. Grundläggande information räcker - mer specifika detaljer kan ni diskutera när någon svarar på din önskning.</p>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          <p><strong>💡 Tips:</strong> Ju mer detaljerad information du ger, desto lättare blir det för intresserade att förstå om varan passar deras behov.</p>
        </div>
      )}
    </div>
  );
}
