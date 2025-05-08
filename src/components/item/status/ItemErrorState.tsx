
import { ItemErrorHandler } from "./ItemErrorHandler";

interface ItemErrorStateProps {
  showError: boolean;
  errors: Error[];
  onRetry: () => void;
  onDismiss: () => void;
}

export function ItemErrorState({
  showError,
  errors,
  onRetry,
  onDismiss
}: ItemErrorStateProps) {
  if (!showError || errors.length === 0) {
    return null;
  }
  
  return (
    <ItemErrorHandler 
      showError={showError}
      errors={errors}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}
