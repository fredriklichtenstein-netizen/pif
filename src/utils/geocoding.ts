
import { useToast } from "@/components/ui/use-toast";

export async function geocodeAddress(address: string, mapboxToken: string) {
  if (!address || !mapboxToken) {
    throw new Error("Missing address or Mapbox token");
  }

  console.log("Geocoding address:", address); // Debug log

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxToken}&country=SE&types=address&language=sv`
  );

  if (!response.ok) {
    throw new Error("Failed to geocode address");
  }

  const data = await response.json();
  console.log("Geocoding response:", data); // Debug log

  if (!data.features || data.features.length === 0) {
    throw new Error("Address not found. Please enter a valid Swedish address.");
  }

  // Get the first (most relevant) result
  const location = data.features[0];
  
  if (!location.place_type.includes('address')) {
    throw new Error("Please enter a complete street address.");
  }

  const [lng, lat] = location.center;
  
  console.log("Geocoding result:", { lat, lng, formattedAddress: location.place_name }); // Debug log

  return {
    lat,
    lng,
    formattedAddress: location.place_name
  };
}
