
import { ItemErrorDisplay } from "../content/ItemErrorDisplay";

interface ItemErrorHandlerProps {
  showError: boolean;
  errors: any[];
  onRetry: () => void;
  onDismiss: () => void;
}

export function ItemErrorHandler({
  showError,
  errors,
  onRetry,
  onDismiss
}: ItemErrorHandlerProps) {
  if (!showError || errors.length === 0) {
    return null;
  }
  
  return (
    <ItemErrorDisplay 
      errors={errors} 
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}
