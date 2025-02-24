
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
    setSuggestions,
    handleAddressChange,
    handleUseCurrentLocation,
    handleShowMap,
  } = useAddress(mapToken, (address: string, coords?: { lat: number; lng: number }) => {
    console.log("Address selected in container:", { address, coords });
    onChange(address, coords);
  });

  const handleAddressInput = async (input: string) => {
    handleAddressChange(input);
    // Auto-validate address when typing
    if (input.length > 3) {
      handleShowMap(input);
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
            onClick={() => handleShowMap(value)}
          >
            {mapButtonLabel}
          </Button>
        </div>
      )}

      <AddressSuggestions
        suggestions={suggestions}
        onSelect={(suggestion) => {
          handleAddressInput(suggestion);
          setSuggestions([]);
        }}
      />

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
