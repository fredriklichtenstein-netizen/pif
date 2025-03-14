
import { useEffect } from "react";

/**
 * Hook to handle avatar update effects
 */
export const useAvatarEffect = (
  avatar: File | null, 
  handleAvatarUpdate: () => Promise<void>
) => {
  // Handle avatar update when avatar changes
  useEffect(() => {
    if (avatar) {
      handleAvatarUpdate();
    }
  }, [avatar, handleAvatarUpdate]);
};
