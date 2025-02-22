
import { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useToast } from "@/hooks/use-toast";
import { geocodeAddress } from "@/utils/geocoding";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
}

export function AddressInput({ value, onChange }: AddressInputProps) {
  const { toast } = useToast();
  const [mapToken, setMapToken] = useState<string>("");
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        toast({
          title: "Error",
          description: "Could not load map functionality. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchMapToken();
  }, []);

  useEffect(() => {
    if (!showMap || !mapToken || !coordinates) return;

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
        // Reverse geocode the coordinates to get the address
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapToken}&language=sv&country=SE`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const newAddress = data.features[0].place_name;
          onChange(newAddress);
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => map.remove();
  }, [showMap, mapToken, coordinates]);

  const handleAddressChange = async (address: string) => {
    onChange(address);
    if (address.length > 3) {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapToken}&country=SE&language=sv&types=address`
        );
        const data = await response.json();
        setSuggestions(
          data.features.map((feature: any) => feature.place_name).slice(0, 5)
        );
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapToken}&language=sv&country=SE`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              onChange(address);
              setCoordinates({ lat: latitude, lng: longitude });
              setShowMap(true);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            toast({
              title: "Error",
              description: "Could not determine your address. Please enter it manually.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Error",
            description: "Could not access your location. Please enter your address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleShowMap = async () => {
    if (value) {
      try {
        const coords = await geocodeAddress(value, mapToken);
        setCoordinates(coords);
        setShowMap(true);
      } catch (error) {
        console.error("Error geocoding address:", error);
        toast({
          title: "Error",
          description: "Could not locate the address on the map. Please verify the address.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter an address first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Enter your address"
            value={value}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleUseCurrentLocation}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Current
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                onClick={() => {
                  onChange(suggestion);
                  setSuggestions([]);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={handleShowMap}
        >
          <Search className="w-4 h-4 mr-2" />
          Show on map
        </Button>
      </div>

      {showMap && (
        <div className="rounded-lg overflow-hidden border h-[300px]" id="address-map" />
      )}
    </div>
  );
}
