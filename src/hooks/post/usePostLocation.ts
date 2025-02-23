
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/utils/geocoding";
import type { CreatePostInput } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocodeAddress = async (mapboxToken: string) => {
    if (!formData.location) {
      toast({
        title: "Missing address",
        description: "Please enter an address first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeocoding(true);
    try {
      console.log("Starting geocoding for address:", formData.location);
      const geocodeResult = await geocodeAddress(formData.location, mapboxToken);
      console.log("Geocoding successful:", geocodeResult);
      
      setFormData(prev => ({ 
        ...prev, 
        coordinates: {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng
        },
        location: geocodeResult.formattedAddress
      }));
      
      console.log("Updated form data with coordinates:", {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng
      });
      
    } catch (error) {
      console.error("Geocoding error:", error);
      setFormData(prev => ({ 
        ...prev, 
        coordinates: undefined 
      }));
      
      toast({
        title: "Invalid address",
        description: error instanceof Error ? error.message : "Please enter a complete Swedish address.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  return {
    isGeocoding,
    handleGeocodeAddress,
  };
};
