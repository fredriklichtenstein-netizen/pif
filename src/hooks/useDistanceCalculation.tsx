
import { useState, useEffect } from "react";
import { calculateDistance, formatDistance } from "@/utils/distance";

interface Coordinates {
  lat: number;
  lng: number;
}

export function useDistanceCalculation(coordinates?: Coordinates) {
  const [distanceText, setDistanceText] = useState<string>("");
  
  useEffect(() => {
    let isMounted = true;

    const updateDistance = async () => {
      // Clear distance if no coordinates provided
      if (!coordinates) {
        if (isMounted) setDistanceText("NaN km");
        return;
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;

            try {
              // Check for valid coordinates
              if (!coordinates.lat || !coordinates.lng) {
                console.log("Invalid coordinates:", coordinates);
                setDistanceText("NaN km");
                return;
              }

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
                setDistanceText("NaN km");
              }
            }
          },
          (error) => {
            console.error("Error getting location:", error.message);
            if (isMounted) {
              setDistanceText("NaN km");
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        if (isMounted) {
          setDistanceText("NaN km");
        }
      }
    };

    updateDistance();

    return () => {
      isMounted = false;
    };
  }, [coordinates]);

  return distanceText;
}
