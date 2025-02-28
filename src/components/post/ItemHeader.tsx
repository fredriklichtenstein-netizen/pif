
import { MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { calculateDistance, formatDistance } from "@/utils/distance";

interface ItemHeaderProps {
  category: string;
  condition?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  title: string;
  description: string;
  postedBy: {
    name: string;
    avatar: string;
  };
  measurements?: Record<string, string>;
}

export function ItemHeader({
  category,
  condition,
  location,
  coordinates,
  title,
  description,
  postedBy,
  measurements = {},
}: ItemHeaderProps) {
  const navigate = useNavigate();
  const [distanceText, setDistanceText] = useState<string>(coordinates ? "Calculating..." : "Location unknown");
  const [showMeasurements, setShowMeasurements] = useState(false);
  
  const hasMeasurements = Object.keys(measurements).length > 0;

  useEffect(() => {
    let isMounted = true;

    const updateDistance = () => {
      if (!coordinates) {
        if (isMounted) setDistanceText("Location unknown");
        return;
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted || !coordinates) return;

            try {
              // Calculate distance using true coordinates for accuracy
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
                setDistanceText(location);
              }
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            if (isMounted) {
              setDistanceText("Enable location to see distance");
            }
          },
          // Add options to improve geolocation responsiveness
          {
            enableHighAccuracy: false, // Don't need high accuracy for rough distances
            timeout: 5000, // Timeout after 5 seconds
            maximumAge: 30000 // Cache location for 30 seconds
          }
        );
      } else {
        if (isMounted) {
          setDistanceText("Location not supported");
        }
      }
    };

    // Initial update
    updateDistance();

    return () => {
      isMounted = false;
    };
  }, [coordinates, location]);

  const handleLocationClick = () => {
    navigate(`/map?location=${encodeURIComponent(location)}`);
  };

  const toggleMeasurements = () => {
    setShowMeasurements(!showMeasurements);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="space-x-2">
          <span className="text-sm font-medium text-secondary">{category}</span>
          {condition && (
            <span className="text-sm text-gray-500">• {condition}</span>
          )}
        </div>
        <button
          onClick={handleLocationClick}
          className="flex items-center text-gray-500 text-sm hover:text-primary transition-colors"
        >
          <MapPin size={14} className="mr-1" />
          <span>{distanceText}</span>
        </button>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">{description}</p>
      
      {hasMeasurements && (
        <div className="mb-3">
          <button 
            onClick={toggleMeasurements}
            className="text-sm text-primary hover:underline font-medium"
          >
            {showMeasurements ? "Hide measurements" : "Show measurements"}
          </button>
          
          {showMeasurements && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(measurements).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <Link
        to={`/profile/${postedBy.name}`}
        className="flex items-center"
      >
        <img
          src={postedBy.avatar}
          alt={postedBy.name}
          className="w-6 h-6 rounded-full mr-2"
        />
        <span className="text-sm text-gray-600">{postedBy.name}</span>
      </Link>
    </div>
  );
}
