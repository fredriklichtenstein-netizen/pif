
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/address/useAddress";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressMap } from "./AddressMap";
import { AddressSearchBar } from "./AddressSearchBar";

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: React.ReactNode;
  hideSearch?: boolean;
}

export function AddressInputContainer({ 
  value, 
  onChange, 
  locationButtonLabel, 
  mapButtonLabel = <Map className="w-4 h-4" />,
  hideSearch 
}: AddressInputProps) {
  const { mapToken } = useMapbox();
  const {
    suggestions,
    showMap,
    coordinates,
    isLoadingSuggestions,
    setSuggestions,
    handleAddressChange,
    handleUseCurrentLocation,
    handleShowMap,
  } = useAddress(mapToken, onChange);

  const handleAddressInput = (input: string) => {
    console.log("handleAddressInput called with:", input);
    handleAddressChange(input);
  };

  const handleSuggestionSelect = async (suggestion: string) => {
    console.log("Suggestion selected:", suggestion);
    setSuggestions([]); // Clear immediately
    const coords = await handleShowMap(suggestion);
    onChange(suggestion, coords);
  };

  const handleMapButtonClick = async () => {
    if (value) {
      const coords = await handleShowMap(value);
      onChange(value, coords);
    }
  };

  return (
    <div className="space-y-4 relative">
      {!hideSearch && (
        <AddressSearchBar 
          value={value}
          onAddressChange={handleAddressInput}
          onLocationClick={handleUseCurrentLocation}
          locationButtonLabel={locationButtonLabel}
        />
      )}

      {hideSearch && (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder="Enter your address"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleMapButtonClick}
          >
            {mapButtonLabel}
          </Button>
        </div>
      )}

      {suggestions.length > 0 && !isLoadingSuggestions && (
        <AddressSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
        />
      )}

      {showMap && coordinates && (
        <AddressMap
          mapToken={mapToken}
          coordinates={coordinates}
          onAddressChange={handleAddressInput}
        />
      )}
    </div>
  );
}
