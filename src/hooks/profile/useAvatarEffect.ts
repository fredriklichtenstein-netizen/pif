
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
      try {
        handleAvatarUpdate();
      } catch (error) {
        console.error("Error in avatar update effect:", error);
      }
    }
  }, [avatar, handleAvatarUpdate]);
};
