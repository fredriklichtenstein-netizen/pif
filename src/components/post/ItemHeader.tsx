
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ItemMetadata } from "./card/ItemMetadata";
import { ItemContent } from "./card/ItemContent";
import { PosterInfo } from "./card/PosterInfo";
import { ItemMeasurements } from "./card/ItemMeasurements";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { useCategoryTranslations } from '@/utils/translations/categories';

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
    avatar?: string;
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
  const { t } = useTranslation();
  const { translateCategory } = useCategoryTranslations();
  const [distanceText, setDistanceText] = useState<string>(coordinates ? t('common.loading') : t('status.location_unknown'));
  
  useEffect(() => {
    let isMounted = true;

    const updateDistance = () => {
      if (!coordinates) {
        if (isMounted) setDistanceText(t('status.location_unknown'));
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
              setDistanceText(t('status.location_access_needed'));
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
          setDistanceText(t('status.location_not_supported'));
        }
      }
    };

    // Initial update
    updateDistance();

    return () => {
      isMounted = false;
    };
  }, [coordinates, location, t]);

  const handleLocationClick = () => {
    navigate(`/map?location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="space-y-3">
      <ItemMetadata 
        category={translateCategory(category)}
        condition={condition}
        location={location}
        distanceText={distanceText}
        coordinates={coordinates}
        onLocationClick={handleLocationClick}
      />
      
      <ItemContent 
        title={title}
        description={description}
        condition={condition}
      />
      
      <ItemMeasurements measurements={measurements} />
      
      <PosterInfo postedBy={postedBy} />
    </div>
  );
}
