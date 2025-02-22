
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface AddressMapProps {
  mapToken: string;
  coordinates: { lat: number; lng: number };
  onAddressChange: (address: string) => void;
}

export function AddressMap({ mapToken, coordinates, onAddressChange }: AddressMapProps) {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: "address-map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      accessToken: mapToken,
    });

    const marker = new mapboxgl.Marker({
      draggable: true,
    })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    marker.on("dragend", async () => {
      const lngLat = marker.getLngLat();
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapToken}&language=sv&country=SE`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const newAddress = data.features[0].place_name;
          onAddressChange(newAddress);
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => map.remove();
  }, [mapToken, coordinates, onAddressChange]);

  return (
    <div className="rounded-lg overflow-hidden border h-[300px]" id="address-map" />
  );
}
