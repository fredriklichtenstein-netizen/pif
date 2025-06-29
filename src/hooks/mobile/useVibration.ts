
import { useCallback } from 'react';

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const isSupported = 'vibrate' in navigator;

  return {
    vibrate,
    isSupported
  };
}
