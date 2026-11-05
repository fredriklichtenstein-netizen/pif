import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface AddressSearchBarProps {
  value: string;
  onAddressChange: (value: string) => void;
  onLocationClick: () => void;
  locationButtonLabel?: React.ReactNode;
  /** The address came from "current location" -- that button shows as selected. */
  locationActive?: boolean;
  /** More buttons after the location button (the PIF-address button). */
  trailing?: React.ReactNode;
}

export function AddressSearchBar({
  value,
  onAddressChange,
  onLocationClick,
  locationButtonLabel,
  locationActive = false,
  trailing,
}: AddressSearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 mb-2">
      <Input
        placeholder={t('interactions.enter_address')}
        value={value}
        onChange={(e) => onAddressChange(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant={locationActive ? "default" : "outline"}
        size={locationButtonLabel ? "default" : "icon"}
        onClick={onLocationClick}
        aria-pressed={locationActive}
        aria-label={t('interactions.use_current_location')}
        title={t('interactions.use_current_location')}
        className={cn("shrink-0 flex items-center gap-2", locationActive && "shadow-sm")}
      >
        <MapPin className="h-4 w-4" />
        {locationButtonLabel}
      </Button>
      {trailing}
    </div>
  );
}
