
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { CreatePostInput, Coordinates } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
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
        title: t('interactions.missing_location'),
        description: t('interactions.missing_location_description'),
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
