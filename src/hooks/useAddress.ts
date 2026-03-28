
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useAddress = (mapToken: string, onAddressChange: (address: string) => void) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleAddressChange = async (address: string) => {
    onAddressChange(address);
    if (address.length > 3) {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapToken}&country=SE&language=sv&types=address`
        );
        const data = await response.json();
        setSuggestions(
          data.features.map((feature: any) => feature.place_name).slice(0, 5)
        );
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapToken}&language=sv&country=SE`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              onAddressChange(address);
              setCoordinates({ lat: latitude, lng: longitude });
              setShowMap(true);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            toast({
              title: "Error",
              description: "Could not determine your address. Please enter it manually.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Error",
            description: "Could not access your location. Please enter your address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleShowMap = async (address: string) => {
    if (address) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapToken}&country=SE&language=sv&types=address`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCoordinates({ lat, lng });
          setShowMap(true);
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        toast({
          title: "Error",
          description: "Could not locate the address on the map. Please verify the address.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter an address first.",
        variant: "destructive",
      });
    }
  };

  return {
    suggestions,
    showMap,
    coordinates,
    isLoadingSuggestions,
    setSuggestions,
    setShowMap,
    handleAddressChange,
    handleUseCurrentLocation,
    handleShowMap,
  };
};
