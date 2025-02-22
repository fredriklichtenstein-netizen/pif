
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/address/useAddress";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressMap } from "./AddressMap";
import { AddressSearchBar } from "./AddressSearchBar";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: string;
}

export function AddressInputContainer({ value, onChange, locationButtonLabel, mapButtonLabel }: AddressInputProps) {
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
      <AddressSearchBar 
        value={value}
        onAddressChange={handleAddressChange}
        onLocationClick={handleUseCurrentLocation}
        locationButtonLabel={locationButtonLabel}
      />

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
        className="w-full mt-2"
        onClick={() => handleShowMap(value)}
      >
        <Search className="w-4 h-4 mr-2" />
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
