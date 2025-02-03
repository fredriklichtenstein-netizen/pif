import { Input } from "@/components/ui/input";

interface PostFormMeasurementsProps {
  category: string;
  measurements: Record<string, string>;
  onMeasurementChange: (field: string, value: string) => void;
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
}: PostFormMeasurementsProps) {
  if (!category || !CATEGORY_MEASUREMENTS[category]) {
    return null;
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Measurements</label>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORY_MEASUREMENTS[category].map((field) => (
          <div key={field} className="space-y-2">
            <label className="text-sm text-gray-600">{field}</label>
            <Input
              value={measurements[field] || ""}
              onChange={(e) => onMeasurementChange(field, e.target.value)}
              placeholder={field}
            />
          </div>
        ))}
      </div>
    </div>
  );
}