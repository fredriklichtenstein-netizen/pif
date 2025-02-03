import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";

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
        />
        <Button
          type="button"
          variant="outline"
          onClick={onGeocodeAddress}
          disabled={isGeocoding || !location}
        >
          {isGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>
      {coordinates && (
        <p className="text-sm text-muted-foreground">
          Location verified ✓
        </p>
      )}
    </div>
  );
}