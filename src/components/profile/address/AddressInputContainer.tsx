
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

/** Fallback map centre when nothing has been picked yet (central Stockholm). */
const DEFAULT_MAP_CENTER = { lat: 59.3293, lng: 18.0686 };

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: React.ReactNode;
  hideSearch?: boolean;
  /**
   * Render the map immediately instead of only after an address has been
   * geocoded, so the user can just tap a spot without typing anything.
   * Opt-in, since most callers show the map behind the toggle button.
   */
  alwaysShowMap?: boolean;
  /** Where to centre the map before anything is picked. */
  defaultCenter?: { lat: number; lng: number };
}

export function AddressInputContainer({
  value,
  onChange,
  locationButtonLabel,
  mapButtonLabel = <Map className="w-4 h-4" />,
  hideSearch,
  alwaysShowMap,
  defaultCenter,
}: AddressInputProps) {
  const { t } = useTranslation();
  const { mapToken } = useMapbox();
  const {
    suggestions,
    showMap,
    coordinates,
    isLoadingSuggestions,
    setSuggestions,
    setShowMap,
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
    if (showMap) {
      setShowMap(false);
      return;
    }
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

      {(alwaysShowMap ? !!mapToken : showMap && !!coordinates) && (
        <div className="space-y-1.5">
          <AddressMap
            mapToken={mapToken}
            coordinates={coordinates ?? defaultCenter ?? DEFAULT_MAP_CENTER}
            hasSelection={!!coordinates}
            onAddressChange={handleAddressInput}
            onLocationPick={(address, coords) => {
              setSuggestions([]);
              onChange(address, coords);
            }}
          />
          <p className="text-xs text-muted-foreground">
            {t('post.map_pick_hint')}
          </p>
        </div>
      )}
    </div>
  );
}
