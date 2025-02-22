
import { AddressInputContainer } from "./AddressInputContainer";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: string;
}

export function AddressInput(props: AddressInputProps) {
  return <AddressInputContainer {...props} />;
}
