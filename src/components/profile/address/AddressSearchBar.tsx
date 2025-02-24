
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface AddressSearchBarProps {
  value: string;
  onAddressChange: (value: string) => void;
  onLocationClick: () => void;
  locationButtonLabel?: React.ReactNode;
}

export function AddressSearchBar({ 
  value, 
  onAddressChange, 
  onLocationClick, 
  locationButtonLabel 
}: AddressSearchBarProps) {
  return (
    <div className="flex gap-2 mb-2">
      <Input
        placeholder="Enter your address"
        value={value}
        onChange={(e) => onAddressChange(e.target.value)}
        className="flex-1"
      />
      <Button 
        type="button" 
        variant="outline" 
        onClick={onLocationClick}
        className="flex items-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        {locationButtonLabel}
      </Button>
    </div>
  );
}
