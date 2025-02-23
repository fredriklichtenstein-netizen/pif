
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/address/useAddress";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressMap } from "./AddressMap";
import { AddressSearchBar } from "./AddressSearchBar";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
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
  } = useAddress(mapToken, onChange);

  return (
    <div className="space-y-4">
      {!hideSearch && (
        <AddressSearchBar 
          value={value}
          onAddressChange={handleAddressChange}
          onLocationClick={handleUseCurrentLocation}
          locationButtonLabel={locationButtonLabel}
        />
      )}

      <AddressSuggestions
        suggestions={suggestions}
        onSelect={(suggestion) => {
          onChange(suggestion);
          setSuggestions([]);
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleShowMap(value)}
      >
        {mapButtonLabel}
      </Button>

      {showMap && coordinates && (
        <AddressMap
          mapToken={mapToken}
          coordinates={coordinates}
          onAddressChange={onChange}
        />
      )}
    </div>
  );
}
