
import { useRef, useState } from "react";
import { useMapbox } from "@/hooks/useMapbox";
import { useAddress } from "@/hooks/address/useAddress";
import { AddressSuggestions } from "./AddressSuggestions";
import { AddressMap } from "./AddressMap";
import { AddressSearchBar } from "./AddressSearchBar";
import { UsePifAddressButton } from "./UsePifAddressButton";
import { usePifAddress } from "@/hooks/usePifAddress";
import { useTranslation } from "react-i18next";

/** Fallback map centre when nothing has been picked yet (central Stockholm). */
const DEFAULT_MAP_CENTER = { lat: 59.3293, lng: 18.0686 };

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  /**
   * Leave out the home ("use my PIF address") button -- for the fields that
   * set the PIF address itself, or another address than it.
   */
  hidePifAddress?: boolean;
  /**
   * Render the map immediately instead of only after an address has been
   * geocoded, so the user can just tap a spot without typing anything.
   * Otherwise the map appears once an address has been picked.
   */
  alwaysShowMap?: boolean;
  /** Where to centre the map before anything is picked. */
  defaultCenter?: { lat: number; lng: number };
  /** Rendered between the address field and the map. */
  belowSearch?: React.ReactNode;
}

export function AddressInputContainer({
  value,
  onChange,
  locationButtonLabel,
  hidePifAddress,
  alwaysShowMap,
  defaultCenter,
  belowSearch,
}: AddressInputProps) {
  const { t } = useTranslation();
  const { mapToken } = useMapbox();
  const { address: pifAddress } = usePifAddress();
  // Which shortcut button filled the field, so it can show as selected.
  // Typing, a suggestion or a map tap clears it.
  const [source, setSource] = useState<'current' | 'pif' | null>(null);
  const awaitingCurrentRef = useRef(false);
  const handleHookChange = (address: string, coords?: { lat: number; lng: number }) => {
    if (awaitingCurrentRef.current && coords) {
      setSource('current');
    } else if (!coords) {
      setSource(null);
    }
    awaitingCurrentRef.current = false;
    onChange(address, coords);
  };
  const {
    suggestions,
    showMap,
    coordinates,
    isLoadingSuggestions,
    setSuggestions,
    handleAddressChange,
    handleUseCurrentLocation,
    handleShowMap,
  } = useAddress(mapToken, handleHookChange);

  const pickCurrentLocation = () => {
    awaitingCurrentRef.current = true;
    handleUseCurrentLocation();
  };
  // A preselected PIF address (e.g. a new post) counts as chosen with the button.
  const pifActive = source === 'pif' || (source === null && !!pifAddress && value === pifAddress);

  const handleAddressInput = (input: string) => {
    handleAddressChange(input);
  };

  const handleSuggestionSelect = async (suggestion: string) => {
    setSource(null);
    setSuggestions([]);
    const coords = await handleShowMap(suggestion);
    onChange(suggestion, coords);
  };

  const handlePifAddressSelect = async (address: string, coordinates: { lat: number; lng: number }) => {
    setSource('pif');
    setSuggestions([]);
    onChange(address, coordinates);
    // Trigger the map preview using the saved coordinates by also asking handleShowMap to show
    await handleShowMap(address);
  };

  return (
    <div className="space-y-4 relative">
      <AddressSearchBar
        value={value}
        onAddressChange={handleAddressInput}
        onLocationClick={pickCurrentLocation}
        locationButtonLabel={locationButtonLabel}
        locationActive={source === 'current'}
        trailing={
          hidePifAddress ? undefined : (
            <UsePifAddressButton onSelect={handlePifAddressSelect} active={pifActive} />
          )
        }
      />

      {suggestions.length > 0 && !isLoadingSuggestions && (
        <AddressSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
        />
      )}

      {belowSearch}

      {(alwaysShowMap ? !!mapToken : showMap && !!coordinates) && (
        <div className="space-y-1.5">
          <AddressMap
            mapToken={mapToken}
            coordinates={coordinates ?? defaultCenter ?? DEFAULT_MAP_CENTER}
            // A value that arrived from outside (a draft, an edit, or the
            // preselected PIF address) still gets its marker.
            hasSelection={!!coordinates || (!!value && !!defaultCenter)}
            onAddressChange={handleAddressInput}
            onLocationPick={(address, coords) => {
              setSource(null);
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
