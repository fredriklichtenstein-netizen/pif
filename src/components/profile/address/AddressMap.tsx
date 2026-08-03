
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import i18n from "@/i18n";

interface AddressMapProps {
  mapToken: string;
  coordinates: { lat: number; lng: number };
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

export function AddressMap({ mapToken, coordinates, onAddressChange, onLocationPick }: AddressMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // Keep the latest callbacks in refs so we don't recreate the map
  // when the parent passes a new function reference each render.
  const onAddressChangeRef = useRef(onAddressChange);
  const onLocationPickRef = useRef(onLocationPick);
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
    onLocationPickRef.current = onLocationPick;
  }, [onAddressChange, onLocationPick]);

  // Initialize the map exactly once on mount, destroy on unmount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapToken) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      accessToken: mapToken,
    });
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);
    markerRef.current = marker;

    // Resolve a point to an address and hand BOTH back to the consumer.
    const commitPoint = async (lngLat: mapboxgl.LngLat) => {
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
    };

    marker.on("dragend", () => commitPoint(marker.getLngLat()));

    // Tap/click anywhere on the map to drop the pin there.
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
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
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([coordinates.lng, coordinates.lat]);
    map.easeTo({ center: [coordinates.lng, coordinates.lat], duration: 400 });
  }, [coordinates.lat, coordinates.lng]);

  return <div ref={containerRef} className="rounded-lg overflow-hidden border h-[300px]" />;
}
