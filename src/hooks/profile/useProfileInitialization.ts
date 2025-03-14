
import { useEffect } from "react";

/**
 * Hook to handle initial profile data loading
 */
export const useProfileInitialization = (
  fetchProfile: () => Promise<{ avatarUrl: string, profileData: any } | null>,
  setAvatarUrl: (url: string) => void
) => {
  // Load profile data on initial mount
  useEffect(() => {
    console.log("useProfileInitialization: Initial profile load effect running");
    const loadProfile = async () => {
      console.log("useProfileInitialization: Loading profile data");
      const profileData = await fetchProfile();
      if (profileData?.avatarUrl) {
        setAvatarUrl(profileData.avatarUrl);
      }
    };
    loadProfile();
  }, [fetchProfile, setAvatarUrl]);
};
