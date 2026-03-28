
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";
import { useTranslation } from "react-i18next";

export const useAddress = (
  mapToken: string, 
  onAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedFetchSuggestions = useCallback(
    debounce(async (address: string) => {
      if (address.length <= 3) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapToken}&country=SE&language=sv&types=address`,
          { signal: abortControllerRef.current.signal }
        );
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        setSuggestions(
          data.features.map((feature: any) => feature.place_name).slice(0, 5)
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching address suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [mapToken]
  );

  const handleAddressChange = (address: string) => {
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
              onAddressChange(address, { lat: latitude, lng: longitude });
              setSuggestions([]);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            toast({
              title: t('post.error'),
              description: t('post.address_error'),
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: t('post.error'),
            description: t('post.location_access_error'),
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleShowMap = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    console.log("useAddress.handleShowMap:", address);
    if (!address) {
      toast({
        title: t('post.error'),
        description: t('post.enter_address_first'),
        variant: "destructive",
      });
      return undefined;
    }

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
        setSuggestions([]);
        return newCoords;
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast({
        title: t('post.error'),
        description: t('post.address_locate_error'),
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
