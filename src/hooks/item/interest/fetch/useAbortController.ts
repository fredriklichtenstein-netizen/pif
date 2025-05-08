
import { useCallback } from "react";

export const useAbortController = () => {
  const setupAbortController = useCallback(() => {
    return new AbortController();
  }, []);

  return { setupAbortController };
};
