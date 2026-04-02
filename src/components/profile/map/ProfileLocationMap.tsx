
import { useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "@/hooks/useMapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface ProfileLocationMapProps {
  coordinates: { lng: number; lat: number };
}

export function ProfileLocationMap({ coordinates }: ProfileLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { mapToken, isLoading: isMapTokenLoading } = useMapbox();

  const center = useMemo(() => {
    const offsetMeters = 200 + Math.random() * 100;
    const angle = Math.random() * 2 * Math.PI;
    const latOffset = offsetMeters / 111000;
    const lngOffset = offsetMeters / (111000 * Math.cos(coordinates.lat * Math.PI / 180));
    return {
      lng: coordinates.lng + lngOffset * Math.cos(angle),
      lat: coordinates.lat + latOffset * Math.sin(angle)
    };
  }, [coordinates.lng, coordinates.lat]);

  useEffect(() => {
    if (!coordinates || !mapToken || !mapContainerRef.current) return;

    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 14,
      interactive: false,
      dragPan: false,
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false,
    });

    mapRef.current = map;

    return () => {
      destroyed = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [coordinates, mapToken]);

  if (isMapTokenLoading) {
    return <div className="w-full h-[200px] rounded-lg border mb-4 bg-muted flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading map...</div>
    </div>;
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[200px] rounded-lg border mb-4"
      style={{ display: "block" }}
    />
  );
}
