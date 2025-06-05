
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

export function PostFormDetails({
  formData,
  setFormData,
  onAddressSelect,
}: PostFormDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Titel */}
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Vad vill du piffa?"
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
        <Label htmlFor="condition">Skick *</Label>
        <Select 
          value={formData.condition} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj skick" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plats */}
      <div className="space-y-2">
        <Label htmlFor="location">Plats *</Label>
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
      </div>
    </div>
  );
}
