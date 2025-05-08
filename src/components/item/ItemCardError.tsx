
import { ItemErrorState } from "./status/ItemErrorState";

export function ItemCardError({
  showError,
  errors,
  onRetry,
  onDismiss
}) {
  return (
    <ItemErrorState 
      showError={showError}
      errors={errors}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}
