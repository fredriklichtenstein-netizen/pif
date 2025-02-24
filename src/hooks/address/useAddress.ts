
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";

export const useAddress = (
  mapToken: string, 
  onAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void
) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Debounced fetch suggestions function
  const debouncedFetchSuggestions = useCallback(
    debounce(async (address: string) => {
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
    }, 300), // 300ms delay
    [mapToken]
  );

  const handleAddressChange = async (address: string) => {
    console.log("useAddress.handleAddressChange:", address);
    onAddressChange(address);
    debouncedFetchSuggestions(address);
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
              setCoordinates({ lat: latitude, lng: longitude });
              setShowMap(true);
              setSuggestions([]); // Clear suggestions
              onAddressChange(address, { lat: latitude, lng: longitude });
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

  const handleShowMap = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    console.log("useAddress.handleShowMap:", address);
    if (address) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapToken}&country=SE&language=sv&types=address`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const newCoords = { lat, lng };
          setCoordinates(newCoords);
          setShowMap(true);
          setSuggestions([]); // Clear suggestions
          return newCoords;
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
    return undefined;
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
