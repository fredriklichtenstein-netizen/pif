
import { AddressInputContainer } from "./AddressInputContainer";

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  locationButtonLabel?: React.ReactNode;
  mapButtonLabel?: React.ReactNode;
  hideSearch?: boolean;
}

export function AddressInput(props: AddressInputProps) {
  console.log("AddressInput rendering with props:", {
    value: props.value,
    hasOnChange: !!props.onChange
  });
  
  return <AddressInputContainer {...props} />;
}
