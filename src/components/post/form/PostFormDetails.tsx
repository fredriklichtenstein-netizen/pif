
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressInput } from "@/components/profile/address/AddressInput";
import type { CreatePostInput } from "@/types/post";

interface PostFormDetailsProps {
  formData: CreatePostInput;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
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

export function PostFormDetails({
  formData,
  setFormData,
  onAddressSelect,
}: PostFormDetailsProps) {
  const isRequest = formData.item_type === 'request';
  const conditions = isRequest ? REQUEST_CONDITIONS : CONDITIONS;
  
  return (
    <div className="space-y-6">
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

      {/* Plats */}
      <div className="space-y-2">
        <Label htmlFor="location">
          {isRequest ? "Var söker du? *" : "Plats *"}
        </Label>
        <AddressInput
          value={formData.location}
          onChange={(address, coordinates) => {
            setFormData(prev => ({ 
              ...prev, 
              location: address,
              coordinates: coordinates || null
            }));
            if (onAddressSelect && coordinates) {
              onAddressSelect(address, coordinates);
            }
          }}
        />
        {isRequest && (
          <p className="text-sm text-muted-foreground">
            Ange var du helst vill hämta/få varan
          </p>
        )}
      </div>
    </div>
  );
}
