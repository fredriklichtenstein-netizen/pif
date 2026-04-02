
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CreatePostInput, Coordinates } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
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

  const validateLocation = () => {
    if (!formData.location || !formData.coordinates || !isAddressVerified) {
      toast({
        title: "Missing location",
        description: "Please enter and verify a valid address",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    isGeocoding,
    isAddressVerified,
    handleAddressSelect,
    validateLocation,
  };
};
