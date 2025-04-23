
import { useRef } from "react";

export const useAbortController = () => {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const setupAbortController = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  return { setupAbortController };
};
