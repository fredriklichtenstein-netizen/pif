
import { useState } from "react";
import type { CreatePostInput, Coordinates } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAddressVerified, setIsAddressVerified] = useState(false);

  const handleAddressSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      coordinates: coordinates || null
    }));
    
    setIsAddressVerified(!!coordinates);
  };

  return {
    isGeocoding,
    isAddressVerified,
    handleAddressSelect,
  };
};
