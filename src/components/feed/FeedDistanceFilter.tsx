import { useCallback, useState } from "react";
import { DistanceFilters } from "@/components/map/distance/DistanceFilters";
import { useLocationProvider } from "@/components/map/location/useLocationProvider";
import { useLocationStorage } from "@/components/map/location/useLocationStorage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface FeedDistanceFilterProps {
  selectedDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  userLocation: [number, number] | null;
  onUserLocationChange: (loc: [number, number] | null) => void;
}

/**
 * Feed-side wrapper around the shared DistanceFilters control. Handles
 * geolocation requests and persists the chosen location so the radius
 * filter syncs with the map view.
 */
export function FeedDistanceFilter({
  selectedDistance,
  onDistanceChange,
  userLocation,
  onUserLocationChange,
}: FeedDistanceFilterProps) {
  const { startTracking } = useLocationProvider();
  const { setStoredLocation } = useLocationStorage();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState(false);

  const updateLocation = useCallback(
    (loc: [number, number] | null) => {
      onUserLocationChange(loc);
      setStoredLocation(loc);
    },
    [onUserLocationChange, setStoredLocation]
  );

  const handleRequestLocation = useCallback(() => {
    if (requesting) return;
    setRequesting(true);
    startTracking(
      ({ coords }) => {
        setRequesting(false);
        updateLocation(coords);
      },
      (err) => {
        setRequesting(false);
        toast({
          variant: "destructive",
          title: t("map.location_error"),
          description: err.message || t("interactions.geolocation_not_supported"),
        });
      }
    );
  }, [requesting, startTracking, updateLocation, toast, t]);

  const handleUsePifAddress = useCallback(
    (coords: [number, number]) => {
      updateLocation(coords);
    },
    [updateLocation]
  );

  return (
    <div className="bg-background border rounded-lg p-2 mb-4 shadow-sm">
      <DistanceFilters
        selectedDistance={selectedDistance}
        onDistanceChange={onDistanceChange}
        userLocation={userLocation}
        onRequestLocation={handleRequestLocation}
        onUsePifAddress={handleUsePifAddress}
      />
    </div>
  );
}
