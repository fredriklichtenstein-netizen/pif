
import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import i18n from "@/i18n";

interface AddressMapProps {
  mapToken: string;
  /** Where the map is centred. */
  coordinates: { lat: number; lng: number };
  /**
   * Whether a pin should be drawn. When false the map opens pin-less, so it
   * can be shown before the user has chosen anything and they can simply tap
   * to place one. Defaults to true for callers that only render the map once
   * a location already exists.
   */
  hasSelection?: boolean;
  onAddressChange: (address: string) => void;
  /**
   * Called when the user picks a point directly on the map (tap or marker
   * drag), with BOTH the reverse-geocoded address and the exact coordinates.
   * Prefer this over onAddressChange: passing only an address string makes
   * the consumer fall back to `coordinates || null`, which wipes the location
   * instead of setting it.
   */
  onLocationPick?: (address: string, coords: { lat: number; lng: number }) => void;
}

export function AddressMap({
  mapToken,
  coordinates,
  hasSelection = true,
  onAddressChange,
  onLocationPick,
}: AddressMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // Keep the latest callbacks in refs so we don't recreate the map
  // when the parent passes a new function reference each render.
  const onAddressChangeRef = useRef(onAddressChange);
  const onLocationPickRef = useRef(onLocationPick);
  const hasSelectionRef = useRef(hasSelection);
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
    onLocationPickRef.current = onLocationPick;
    hasSelectionRef.current = hasSelection;
  }, [onAddressChange, onLocationPick, hasSelection]);

  // Resolve a point to an address and hand BOTH back to the consumer.
  const commitPoint = useCallback(
    async (lngLat: { lng: number; lat: number }) => {
      const coords = { lat: lngLat.lat, lng: lngLat.lng };
      try {
        const geocodeLang = i18n.language?.startsWith("sv") ? "sv" : "en";
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapToken}&language=${geocodeLang}`
        );
        const data = await response.json();
        const placeName = data.features?.[0]?.place_name;
        if (!placeName) return;

        if (onLocationPickRef.current) {
          onLocationPickRef.current(placeName, coords);
        } else {
          onAddressChangeRef.current(placeName);
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    },
    [mapToken]
  );

  const ensureMarker = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      const map = mapRef.current;
      if (!map) return;
      if (markerRef.current) {
        markerRef.current.setLngLat([lngLat.lng, lngLat.lat]);
        return;
      }
      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([lngLat.lng, lngLat.lat])
        .addTo(map);
      marker.on("dragend", () => commitPoint(marker.getLngLat()));
      markerRef.current = marker;
    },
    [commitPoint]
  );

  // Initialize the map exactly once on mount, destroy on unmount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapToken) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [coordinates.lng, coordinates.lat],
      zoom: hasSelectionRef.current ? 15 : 11,
      accessToken: mapToken,
    });
    mapRef.current = map;

    if (hasSelectionRef.current) {
      ensureMarker(coordinates);
    }

    // Tap/click anywhere on the map to drop the pin there.
    map.on("click", (e) => {
      ensureMarker(e.lngLat);
      commitPoint(e.lngLat);
    });
    map.getCanvas().style.cursor = "crosshair";

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      try {
        markerRef.current?.remove();
      } catch {
        /* noop */
      }
      try {
        mapRef.current?.remove();
      } catch {
        /* noop */
      }
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapToken]);

  // When coordinates change, just move the existing map/marker — do
  // NOT recreate the WebGL context.
  const hadSelectionRef = useRef(hasSelection);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (hasSelection) {
      ensureMarker(coordinates);
    } else if (markerRef.current) {
      // Selection was cleared — drop the pin rather than leaving a stale one.
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Zoom in only on the first selection (e.g. "use my current location"
    // from a pin-less map). Re-zooming on every later change would fight the
    // user's own panning/zooming as they tap around to fine-tune the spot.
    const justSelected = hasSelection && !hadSelectionRef.current;
    hadSelectionRef.current = hasSelection;

    map.easeTo({
      center: [coordinates.lng, coordinates.lat],
      ...(justSelected ? { zoom: 15 } : {}),
      duration: 400,
    });
  }, [coordinates.lat, coordinates.lng, hasSelection, ensureMarker]);

  return <div ref={containerRef} className="rounded-lg overflow-hidden border h-[300px]" />;
}
