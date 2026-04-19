
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/address/useAddress";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressMap } from "./AddressMap";
import { AddressSearchBar } from "./AddressSearchBar";
import { UsePifAddressButton } from "./UsePifAddressButton";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    handleAddressChange(input);
  };

  const handleSuggestionSelect = async (suggestion: string) => {
    setSuggestions([]);
    const coords = await handleShowMap(suggestion);
    onChange(suggestion, coords);
  };

  const handleMapButtonClick = async () => {
    if (value) {
      const coords = await handleShowMap(value);
      onChange(value, coords);
    }
  };

  const handlePifAddressSelect = async (address: string, coordinates: { lat: number; lng: number }) => {
    setSuggestions([]);
    onChange(address, coordinates);
    // Trigger the map preview using the saved coordinates by also asking handleShowMap to show
    await handleShowMap(address);
  };

  return (
    <div className="space-y-4 relative">
      {!hideSearch && (
        <>
          <AddressSearchBar 
            value={value}
            onAddressChange={handleAddressInput}
            onLocationClick={handleUseCurrentLocation}
            locationButtonLabel={locationButtonLabel}
          />
          <div className="-mt-2">
            <UsePifAddressButton onSelect={handlePifAddressSelect} />
          </div>
        </>
      )}

      {hideSearch && (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder={t('interactions.enter_address')}
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
