
import { useState, useEffect } from "react";
import { calculateDistance, formatDistance } from "@/utils/distance";

interface Coordinates {
  lat: number;
  lng: number;
}

export function useDistanceCalculation(coordinates?: Coordinates) {
  const [distanceText, setDistanceText] = useState<string>(coordinates ? "Calculating..." : "");
  
  useEffect(() => {
    let isMounted = true;

    const updateDistance = () => {
      if (!coordinates) {
        if (isMounted) setDistanceText("");
        return;
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted || !coordinates) return;

            try {
              const distance = calculateDistance(
                position.coords.latitude,
                position.coords.longitude,
                coordinates.lat,
                coordinates.lng
              );
              
              if (isMounted) {
                setDistanceText(formatDistance(distance));
              }
            } catch (error) {
              console.error("Error calculating distance:", error);
              if (isMounted) {
                setDistanceText("");
              }
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            if (isMounted) {
              setDistanceText("");
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 30000
          }
        );
      }
    };

    updateDistance();

    return () => {
      isMounted = false;
    };
  }, [coordinates]);

  return distanceText;
}
