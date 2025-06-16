
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostFormSizeSelector } from "./PostFormSizeSelector";
import { Weight } from "lucide-react";
import type { CreatePostInput } from "@/types/post";

interface PostFormInformationProps {
  formData: CreatePostInput;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onMeasurementChange: (field: string, value: string) => void;
}

const CATEGORIES = [
  "Furniture",
  "Electronics", 
  "Clothing",
  "Kitchen",
  "Books",
  "Toys",
  "Garden",
  "Sports",
  "Other"
];

const CONDITIONS = [
  "Nytt",
  "Som nytt", 
  "Mycket bra",
  "Bra",
  "Acceptabelt",
  "Behöver reparation"
];

const REQUEST_CONDITIONS = [
  "Vilket skick som helst",
  "Föredrar nytt/som nytt",
  "Bra skick räcker",
  "Kan vara slitet"
];

const CATEGORY_MEASUREMENTS: { [key: string]: string[] } = {
  "Clothing": ["Chest", "Length", "Shoulders", "Sleeves"],
  "Shoes": ["EU Size", "US Size", "UK Size", "Insole Length"],
  "Children's Clothing": ["Age", "Height", "Chest", "Length"],
  "Furniture": ["Width", "Depth", "Height"],
};

export function PostFormInformation({
  formData,
  setFormData,
  onMeasurementChange,
}: PostFormInformationProps) {
  const isRequest = formData.item_type === 'request';
  const conditions = isRequest ? REQUEST_CONDITIONS : CONDITIONS;
  const measurements = formData.measurements || {};

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleSizeChange = (size: string) => {
    onMeasurementChange("size", size === "none" ? "" : size);
  };
  
  const handleCustomSizeChange = (customSize: string) => {
    onMeasurementChange("customSize", customSize);
    
    if (customSize && (!measurements.size || measurements.size === "none")) {
      onMeasurementChange("size", customSize);
    }
  };

  const showWeightField = !isRequest;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Information</h3>
        <p className="text-sm text-muted-foreground">
          {isRequest 
            ? "Beskriv vad du söker och dina preferenser"
            : "Beskriv varan och dess egenskaper"
          }
        </p>
      </div>

      {/* Grundläggande information */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Grundläggande information</h4>
          
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {isRequest ? "Vad söker du? *" : "Titel *"}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={isRequest ? "t.ex. 'Barnstol', 'Cykel för vuxen'" : "Vad vill du piffa?"}
              required
            />
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skick */}
          <div className="space-y-2">
            <Label htmlFor="condition">
              {isRequest ? "Önskat skick *" : "Skick *"}
            </Label>
            <Select 
              value={formData.condition} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRequest ? "Välj önskat skick" : "Välj skick"} />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Beskrivning */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Beskrivning</h4>
          
          <div className="space-y-2">
            <Label htmlFor="description">
              {isRequest ? "Beskrivning av vad du söker *" : "Beskrivning *"}
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={handleDescriptionChange}
              placeholder={isRequest 
                ? "Beskriv vad du söker och eventuella specifika krav eller önskemål..."
                : "Beskriv varan, dess skick och eventuella defekter..."
              }
              className="min-h-[120px]"
              required
            />
          </div>
          
          {isRequest && (
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p><strong>Tips:</strong> Var så specifik som möjligt om vad du söker. Detta hjälper andra att förstå om de har något som passar dina behov.</p>
            </div>
          )}
        </div>

        {/* Storlek och mått */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">
            {isRequest ? "Storlek & Preferenser" : "Storlek & Mått"}
          </h4>

          {/* Storlek för kläder */}
          {formData.category?.toLowerCase().includes("clothing") && (
            <PostFormSizeSelector 
              category={formData.category} 
              measurements={measurements} 
              onSizeChange={handleSizeChange}
              onCustomSizeChange={handleCustomSizeChange}
              itemType={formData.item_type}
            />
          )}
          
          {/* Detaljerade mått för erbjudanden */}
          {!isRequest && formData.category && CATEGORY_MEASUREMENTS[formData.category] && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Detaljerade mått</Label>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORY_MEASUREMENTS[formData.category].map((field) => (
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

          {/* Preferenser för önskningar */}
          {isRequest && (
            <div className="space-y-2">
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
          
          {/* Vikt endast för erbjudanden */}
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

          {/* Tips */}
          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <p>
              <strong>💡 Tips:</strong> {isRequest
                ? "Du behöver inte fylla i alla detaljer. Grundläggande information räcker - mer specifika detaljer kan ni diskutera när någon svarar på din önskning."
                : "Ju mer detaljerad information du ger, desto lättare blir det för intresserade att förstå om varan passar deras behov."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
