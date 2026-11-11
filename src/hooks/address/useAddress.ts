
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
function debounce<T extends (...args: any[]) => any>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  (debounced as any).cancel = () => { if (timer) clearTimeout(timer); };
  return debounced as T & { cancel: () => void };
}
import { useTranslation } from "react-i18next";

export const useAddress = (
  mapToken: string, 
  onAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void
) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const geocodeLang = i18n.language?.startsWith("sv") ? "sv" : "en";
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
          )}.json?access_token=${mapToken}&language=${geocodeLang}&types=address`,
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
    [mapToken, geocodeLang]
  );

  const handleAddressChange = (address: string) => {
    onAddressChange(address);
    debouncedFetchSuggestions(address);
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;

    const onPosition = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapToken}&language=${geocodeLang}`
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
    };

    const onFinalError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);
      toast({
        title: t('post.error'),
        // Blocked needs a different fix (site settings) than a position
        // the device couldn't work out.
        description:
          error.code === error.PERMISSION_DENIED
            ? t('settings.location_denied_help')
            : t('post.location_access_error'),
        variant: "destructive",
      });
    };

    // Same as liveLocationStore: high accuracy first, then a retry with
    // Wi-Fi/IP positioning. Desktops without GPS (a Mac, say) often fail
    // the first with POSITION_UNAVAILABLE but answer the second.
    navigator.geolocation.getCurrentPosition(
      onPosition,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          onFinalError(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(onPosition, onFinalError, {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 15000,
        });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  };

  const handleShowMap = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    // Callers only pass a non-empty address.
    if (!address) return undefined;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapToken}&language=${geocodeLang}&types=address`
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
