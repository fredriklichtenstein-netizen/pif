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
        // Surface the real GeolocationPositionError code instead of
        // falling back to "not supported" copy -- that fallback was firing
        // even when geolocation genuinely IS available, just because
        // err.message came back empty on some browsers (confirmed live:
        // the real signal was a second toast, "Timeout expired").
        const [title, description] =
          err.code === err.PERMISSION_DENIED
            ? [t("interactions.location_permission_denied"), t("interactions.location_permission_description")]
            : err.code === err.TIMEOUT
              ? [t("interactions.location_timeout"), t("interactions.location_timeout_description")]
              : [t("interactions.location_unavailable"), t("interactions.location_unavailable_description")];
        toast({ variant: "destructive", title, description });
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
    <div className="mb-2">
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
