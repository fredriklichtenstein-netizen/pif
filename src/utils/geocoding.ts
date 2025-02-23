
import { useToast } from "@/components/ui/use-toast";

export async function geocodeAddress(address: string, mapboxToken: string) {
  if (!address || !mapboxToken) {
    throw new Error("Missing address or Mapbox token");
  }

  // Ensure we're using the correct endpoint and parameters for Swedish addresses
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxToken}&country=SE&types=address&language=sv`
  );

  if (!response.ok) {
    throw new Error("Failed to geocode address");
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error("Address not found. Please enter a valid Swedish address.");
  }

  // Get the first (most relevant) result
  const location = data.features[0];
  
  // Verify that we have a valid address result
  if (!location.place_type.includes('address')) {
    throw new Error("Please enter a complete street address.");
  }

  const [lng, lat] = location.center;
  
  // Return both coordinates and the formatted address
  return {
    lat,
    lng,
    formattedAddress: location.place_name
  };
}
