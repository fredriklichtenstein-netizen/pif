
import { AddressInputContainer } from "./AddressInputContainer";

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: React.ReactNode;
  hideSearch?: boolean;
  alwaysShowMap?: boolean;
  defaultCenter?: { lat: number; lng: number };
}

export function AddressInput(props: AddressInputProps) {
  return <AddressInputContainer {...props} />;
}
