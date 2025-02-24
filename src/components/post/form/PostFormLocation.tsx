
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PostFormLocationProps {
  location: string;
  coordinates?: { lat: number; lng: number };
  isGeocoding: boolean;
  onLocationChange: (value: string) => void;
  onGeocodeAddress: () => void;
}

export function PostFormLocation({
  location,
  coordinates,
  isGeocoding,
  onLocationChange,
  onGeocodeAddress,
}: PostFormLocationProps) {
  const { toast } = useToast();

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&types=address&language=sv`
          );
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            onLocationChange(data.features[0].place_name);
            onGeocodeAddress();
          }
        } catch (error) {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "Could not get your current location",
            variant: "destructive",
          });
        }
      },
      () => {
        toast({
          title: "Error",
          description: "Unable to get your location",
          variant: "destructive",
        });
      }
    );
  };

  // Try to load address from profile on mount
  useEffect(() => {
    const profileAddress = sessionStorage.getItem('profile_address');
    if (profileAddress && !location) {
      onLocationChange(profileAddress);
      onGeocodeAddress();
    }
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor="location" className="text-sm font-medium">
        Location
      </label>
      <div className="flex gap-2">
        <Input
          id="location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Enter your address"
          required
          tabIndex={0}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onGeocodeAddress}
          disabled={isGeocoding || !location}
          tabIndex={0}
          aria-label="Verify location"
        >
          {isGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGetCurrentLocation}
          tabIndex={0}
          aria-label="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      {coordinates && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Location verified ✓
        </p>
      )}
    </div>
  );
}
