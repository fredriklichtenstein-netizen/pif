
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { MapFilters } from "./MapFilters";
import { Button } from "@/components/ui/button";
import { Locate, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";
import { DistanceRings } from "./distance/DistanceRings";
import { useDistanceFiltering } from "@/hooks/useDistanceFiltering";
import { useTranslation } from "react-i18next";
import "./MapStyles.css";

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick, targetItemId }: MapContainerProps) => {
  const { mapContainer, map, isMapReady, error, retryInitialization } = useMapInitialization(mapboxToken);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const locationTracking = useLocationTracking(isMapReady ? map : null);
  const { t } = useTranslation();
  // Distance filtering
  const {
    filteredPosts,
    selectedDistance,
    setSelectedDistance
  } = useDistanceFiltering({
    posts,
    userLocation: locationTracking.userLocation
  });

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);

  // Apply all filters including distance
  const finalFilteredPosts = filteredPosts.filter(post => {
    if (selectedItemTypes.length > 0 && !selectedItemTypes.includes(post.item_type || 'offer')) {
      return false;
    }
    if (selectedCategories.length > 0 && (!post.category || !selectedCategories.includes(post.category))) {
      return false;
    }
    if (selectedConditions.length > 0 && (!post.condition || !selectedConditions.includes(post.condition))) {
      return false;
    }
    return true;
  });
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedItemTypes([]);
    setSelectedDistance(null);
  };

  useEffect(() => {
    if (isMapReady && map) {
      const timer = setTimeout(() => {
        setIsMapVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
    }
  }, [isMapReady, map]);

  // Handle target item centering
  useEffect(() => {
    if (!isMapReady || !map || !targetItemId || !posts.length) return;
    const targetPost = posts.find(post => post.id === targetItemId);
    
    if (!targetPost?.coordinates) {
      return;
    }
    
    const { lng, lat } = targetPost.coordinates;
    
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      console.error("🚨 [MapContainer] Invalid coordinates for target post:", { lng, lat });
      return;
    }
    try {
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500
      });
    } catch (error) {
      console.error("🚨 [MapContainer] Error during flyTo:", error);
    }
  }, [isMapReady, map, targetItemId, posts]);

  return (
    <div className="map-container">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          opacity: isMapVisible ? 1 : 0,
          transition: isMapReady ? 'opacity 0.5s ease-in-out' : 'none'
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground mb-2 font-medium">{t('map.error_initializing')}</p>
            <p className="text-muted-foreground text-sm mb-6">{error.message}</p>
            <Button 
              onClick={retryInitialization} 
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" /> {t('common.retry')}
            </Button>
          </div>
        </div>
      )}
      
      {!isMapReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('map.initializing')}</p>
            <p className="text-muted-foreground text-sm mt-2">
              {mapboxToken ? t('map.token_loaded') : t('map.loading_credentials')}
            </p>
          </div>
        </div>
      )}
      
      {isMapReady && !error && map && (
        <>
          <MapFilters
            posts={filteredPosts}
            selectedCategories={selectedCategories}
            selectedConditions={selectedConditions}
            selectedItemTypes={selectedItemTypes}
            onCategoryChange={setSelectedCategories}
            onConditionChange={setSelectedConditions}
            onItemTypeChange={setSelectedItemTypes}
            onClearFilters={handleClearFilters}
            selectedDistance={selectedDistance}
            onDistanceChange={setSelectedDistance}
            userLocation={locationTracking.userLocation}
          />

          <DistanceRings
            map={map}
            center={locationTracking.userLocation}
            visible={selectedDistance !== null && locationTracking.userLocation !== null}
            rings={selectedDistance ? [selectedDistance] : []}
          />

          <MapMarkersLayer 
            map={map}
            posts={finalFilteredPosts}
            onPostClick={onPostClick}
            targetItemId={targetItemId}
          />

          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              onClick={locationTracking.goToMyLocation}
              disabled={locationTracking.isLoadingLocation}
              className="bg-white hover:bg-gray-100 text-gray-800 cursor-pointer"
              size="icon"
              variant="outline"
              title={t('map.my_location')}
            >
              {locationTracking.isLoadingLocation ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Locate className="h-4 w-4" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
});

MapContainer.displayName = "MapContainer";
