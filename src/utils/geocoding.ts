import { useToast } from "@/components/ui/use-toast";

export async function geocodeAddress(address: string, mapboxToken: string) {
  if (!address || !mapboxToken) {
    throw new Error("Missing address or Mapbox token");
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxToken}&country=SE`
  );

  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }

  throw new Error("Location not found. Please enter a valid address in Sweden.");
}