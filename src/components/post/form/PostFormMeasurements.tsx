
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

  return (
    <div className="space-y-6">
      {category?.toLowerCase().includes("clothing") && (
        <PostFormSizeSelector 
          category={category} 
          measurements={measurements} 
          onSizeChange={handleSizeChange}
          onCustomSizeChange={handleCustomSizeChange}
          itemType={itemType}
        />
      )}
      
      {/* Only show detailed measurements for offers, and only if category has measurements */}
      {!isRequest && category && CATEGORY_MEASUREMENTS[category] && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Detailed Measurements</Label>
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
      
      {/* Only show weight for offers */}
      {showWeightField && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium">Weight</Label>
          </div>
          <Input
            value={measurements.weight || ""}
            onChange={(e) => onMeasurementChange("weight", e.target.value)}
            placeholder="e.g. 5 kg"
            className="max-w-[200px]"
          />
        </div>
      )}

      {/* For requests, show a helpful message */}
      {isRequest && (
        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          <p>För önskningar behöver du bara ange grundläggande information. Detaljerade mått kan diskuteras med den som erbjuder varan.</p>
        </div>
      )}
    </div>
  );
}
