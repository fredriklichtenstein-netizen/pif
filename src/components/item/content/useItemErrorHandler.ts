
import { useState, useEffect } from "react";

export function useItemErrorHandler() {
  const [errors, setErrors] = useState<Array<{
    message: string;
  }>>([]);
  const [showError, setShowError] = useState(false);

  // Error boundary for component errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error caught by ItemCardWrapper error handler:', event.error);
      setErrors(prev => [...prev, {
        message: event.message
      }]);
      setShowError(true);
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleDismissError = () => {
    setShowError(false);
  };

  return {
    errors,
    showError,
    handleRetry,
    handleDismissError
  };
}
