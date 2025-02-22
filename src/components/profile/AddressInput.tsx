
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/useAddress";
import { AddressSuggestions } from "./address/AddressSuggestions";
import { AddressMap } from "./address/AddressMap";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: string;
}

export function AddressInput({ value, onChange, locationButtonLabel, mapButtonLabel }: AddressInputProps) {
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
            {locationButtonLabel}
          </Button>
        </div>

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
      </div>

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
