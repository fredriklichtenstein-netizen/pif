
import { AddressInputContainer } from "./AddressInputContainer";

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  hidePifAddress?: boolean;
  alwaysShowMap?: boolean;
  defaultCenter?: { lat: number; lng: number };
  /** Rendered between the address field and the map. */
  belowSearch?: React.ReactNode;
}

export function AddressInput(props: AddressInputProps) {
  return <AddressInputContainer {...props} />;
}
