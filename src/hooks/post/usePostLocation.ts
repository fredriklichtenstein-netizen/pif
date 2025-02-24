
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/utils/geocoding";
import { formatCoordinatesForDB } from "@/types/post";
import type { CreatePostInput } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocodeAddress = async (mapboxToken: string, isInitialLoad = false) => {
    if (!formData.location) {
      if (!isInitialLoad) {
        toast({
          title: "Missing address",
          description: "Please enter an address first.",
          variant: "destructive",
        });
      }
      return;
    }
    
    setIsGeocoding(true);
    try {
      console.log("Starting geocoding for address:", formData.location);
      const geocodeResult = await geocodeAddress(formData.location, mapboxToken);
      console.log("Geocoding successful:", geocodeResult);
      
      // Convert coordinates to PostgreSQL point format
      const coordinates = formatCoordinatesForDB({
        lat: geocodeResult.lat,
        lng: geocodeResult.lng
      });
      
      // Update form data in a single operation to prevent race conditions
      setFormData(prev => ({ 
        ...prev, 
        coordinates,
        location: geocodeResult.formattedAddress
      }));
      
      console.log("Updated form data with coordinates:", coordinates);
      
      if (!isInitialLoad) {
        toast({
          title: "Location verified",
          description: "Address has been successfully verified.",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      
      // Don't clear coordinates immediately on profile address fetch
      if (!isInitialLoad) {
        setFormData(prev => ({ 
          ...prev, 
          coordinates: null
        }));
        
        toast({
          title: "Invalid address",
          description: error instanceof Error ? error.message : "Please enter a complete Swedish address.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  return {
    isGeocoding,
    handleGeocodeAddress,
  };
};
