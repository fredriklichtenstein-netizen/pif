
import type { Post } from "@/types/post";
import { useMapInitialization } from "./useMapInitialization";
import { MapMarkersLayer } from "./MapMarkersLayer";
import { MapFiltersSheet } from "./MapFiltersSheet";
import { Button } from "@/components/ui/button";
import { Locate, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, memo } from "react";
import { useLocationTracking } from "./useLocationTracking";
import { DistanceRings } from "./distance/DistanceRings";
import { useDistanceFiltering } from "@/hooks/useDistanceFiltering";
import { useTranslation } from "react-i18next";
import { usePifAddress } from "@/hooks/usePifAddress";
import { useRefreshSyncStore } from "@/stores/refreshSyncStore";
import { useFeedFiltersStore } from "@/stores/feedFiltersStore";
import { applyPostFilters } from "@/utils/postFilters";
import { useMyInterestedIds } from "@/hooks/useMyInterestedIds";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import "./MapStyles.css";

const MAP_SESSION_INIT_KEY = 'map_session_initialized';

interface MapContainerProps {
  mapboxToken: string;
  posts: Post[];
  onPostClick: (postId: string) => void;
  targetItemId?: string | null;
}

export const MapContainer = memo(({ mapboxToken, posts, onPostClick, targetItemId }: MapContainerProps) => {
  const { mapContainer, map, isMapReady, error, retryInitialization } = useMapInitialization(mapboxToken);
  const isRefreshing = useRefreshSyncStore((s) => s.isRefreshing);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const locationTracking = useLocationTracking(isMapReady ? map : null);
  const { t } = useTranslation();
  const { coordinates: pifCoordinates } = usePifAddress();
  // Distance filtering
  const {
    filteredPosts,
    selectedDistance,
    setSelectedDistance
  } = useDistanceFiltering({
    posts,
    userLocation: locationTracking.userLocation
  });

  // Filter state lives in the shared feedFiltersStore so changes made
  // here are mirrored on /feed (and vice-versa) and persisted via the
  // existing versioned mapFiltersStorage helper.
  const selectedCategories = useFeedFiltersStore((s) => s.categories);
  const selectedConditions = useFeedFiltersStore((s) => s.conditions);
  const selectedItemTypes = useFeedFiltersStore((s) => s.itemTypes);
  const onlyInterested = useFeedFiltersStore((s) => s.onlyInterested);
  const setSelectedCategories = useFeedFiltersStore((s) => s.setCategories);
  const setSelectedConditions = useFeedFiltersStore((s) => s.setConditions);
  const setSelectedItemTypes = useFeedFiltersStore((s) => s.setItemTypes);
  const setOnlyInterested = useFeedFiltersStore((s) => s.setOnlyInterested);
  const clearAllFilters = useFeedFiltersStore((s) => s.clearAll);

  const { user } = useGlobalAuth();
  const { ids: myInterestedIds } = useMyInterestedIds();

  // Auto-disable the "interested only" filter on sign-out so a logged-out
  // user never sees an empty map with a hidden invisible filter applied.
  useEffect(() => {
    if (!user && onlyInterested) setOnlyInterested(false);
  }, [user, onlyInterested, setOnlyInterested]);

  // Apply all filters including distance
  const finalFilteredPosts = applyPostFilters(
    filteredPosts,
    {
      categories: selectedCategories,
      conditions: selectedConditions,
      itemTypes: selectedItemTypes,
      onlyInterested,
    },
    myInterestedIds,
  );
  const handleClearFilters = () => {
    clearAllFilters();
    setSelectedDistance(null);
  };

  // Defensive guard: even though the map is wrapped in an `inert`
  // container during refresh, wrap every state-mutating handler so
  // any stray event (programmatic dispatch, focus traps, etc.) cannot
  // change map state mid-update.
  const guarded = <A extends unknown[]>(fn: (...a: A) => void) =>
    (...args: A) => {
      if (useRefreshSyncStore.getState().isRefreshing) return;
      fn(...args);
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

  // When a refresh starts, dismiss any open marker popup so the user
  // can't tap a popup CTA mid-update.
  useEffect(() => {
    if (!isRefreshing) return;
    const popups = document.getElementsByClassName("mapboxgl-popup");
    while (popups[0]) popups[0].remove();
  }, [isRefreshing]);

  // First-load: restore saved mode (current/pif) or center on PIF address by default (once per session)
  useEffect(() => {
    if (!isMapReady || !map) return;
    try {
      const alreadyInitialized = sessionStorage.getItem(MAP_SESSION_INIT_KEY);
      // If the map already has a saved session state (zoom/center), respect it
      // and do not auto-recenter — useMapInitialization restored it already.
      const hasSavedMapState = !!sessionStorage.getItem('map_last_state');
      if (alreadyInitialized || hasSavedMapState) {
        if (!alreadyInitialized) sessionStorage.setItem(MAP_SESSION_INIT_KEY, '1');
        return;
      }

      const savedMode = sessionStorage.getItem('map_location_mode');

      if (savedMode === 'current') {
        sessionStorage.setItem(MAP_SESSION_INIT_KEY, '1');
        locationTracking.goToMyLocation();
        return;
      }

      // Default (and savedMode === 'pif'): center on PIF address if available
      if (!pifCoordinates) return;
      const { lng, lat } = pifCoordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) return;
      map.jumpTo({ center: [lng, lat], zoom: 14 });
      locationTracking.setManualLocation([lng, lat]);
      sessionStorage.setItem(MAP_SESSION_INIT_KEY, '1');
      if (!savedMode) sessionStorage.setItem('map_location_mode', 'pif');
    } catch (e) {
      console.error('[MapContainer] session init centering failed:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, map, pifCoordinates]);

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
          </div>
        </div>
      )}
      
      {isMapReady && !error && map && (
        <>
          {/* Quick type pills + Filtrera trigger (consolidated sheet) */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start gap-2 pointer-events-none">
            <div className="pointer-events-auto flex-1 min-w-0">
              <div className="flex items-center gap-1 bg-background rounded-lg shadow-md p-1 w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={guarded(() => setSelectedItemTypes([]))}
                  className={`text-xs px-3 ${
                    selectedItemTypes.length === 0 || selectedItemTypes.length === 2
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-accent"
                  }`}
                >
                  {t("map_filters.all")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={guarded(() => setSelectedItemTypes(["offer"]))}
                  className={`text-xs px-3 ${
                    selectedItemTypes.length === 1 && selectedItemTypes.includes("offer")
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "hover:bg-teal-50 text-teal-700"
                  }`}
                >
                  🎁 {t("map_filters.pifs")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={guarded(() => setSelectedItemTypes(["request"]))}
                  className={`text-xs px-3 ${
                    selectedItemTypes.length === 1 && selectedItemTypes.includes("request")
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "hover:bg-amber-50 text-amber-700"
                  }`}
                >
                  ✨ {t("map_filters.wishes")}
                </Button>
              </div>
            </div>
            <div className="pointer-events-auto">
              <MapFiltersSheet
                posts={filteredPosts}
                selectedCategories={selectedCategories}
                onCategoryChange={guarded(setSelectedCategories)}
                selectedConditions={selectedConditions}
                onConditionChange={guarded(setSelectedConditions)}
                selectedItemTypes={selectedItemTypes}
                selectedDistance={selectedDistance}
                onDistanceChange={guarded(setSelectedDistance)}
                userLocation={locationTracking.userLocation}
                onUserLocationChange={guarded((loc) => {
                  if (loc) locationTracking.setManualLocation(loc);
                  else locationTracking.goToMyLocation();
                })}
                onlyInterested={onlyInterested}
                onOnlyInterestedChange={guarded(setOnlyInterested)}
                onResetAll={guarded(handleClearFilters)}
              />
            </div>
          </div>


          <DistanceRings
            map={map}
            center={locationTracking.userLocation}
            visible={selectedDistance !== null && locationTracking.userLocation !== null}
            rings={selectedDistance ? [selectedDistance] : []}
          />

          <MapMarkersLayer 
            map={map}
            posts={finalFilteredPosts}
            // Guarded so a tap on a Mapbox marker (which lives on the
            // canvas, outside the React tree) cannot open a popup or
            // navigate while a refresh is in flight.
            onPostClick={guarded(onPostClick)}
            targetItemId={targetItemId}
          />

          <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-10">
            <Button
              onClick={guarded(() => {
                try { sessionStorage.setItem('map_location_mode', 'current'); } catch {}
                locationTracking.goToMyLocation();
              })}
              disabled={locationTracking.isLoadingLocation || isRefreshing}
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
