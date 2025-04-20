
import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * Utility function to safely extract user data from profile object
 * and to format name in "First LastInitial" form, only ever exposing
 * the first letter of the last name (never full last name).
 */
export const extractUserFromProfile = (
  userProfile: Record<string, any> | null,
  fallbackId: string
): User => {
  if (!userProfile) {
    return {
      id: fallbackId,
      name: "Anonymous",
      avatar: `https://ui-avatars.com/api/?name=Anonymous&background=random`
    };
  }

  // Safely access profile properties
  const firstName = "first_name" in userProfile
    ? (userProfile.first_name as string || "")
    : "";

  const lastName = "last_name" in userProfile
    ? userProfile.last_name as string || ""
    : "";

  // Format as "First L"
  let displayName = firstName;
  if (firstName && lastName.length > 0) {
    displayName = `${firstName} ${lastName.charAt(0)}`;
  } else if (!firstName) {
    displayName = "Anonymous";
  }

  // Get ID and avatar
  const id = "id" in userProfile ? userProfile.id as string : fallbackId;

  const avatarUrl = "avatar_url" in userProfile
    ? userProfile.avatar_url as string
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return {
    id,
    name: displayName,
    avatar: avatarUrl
  };
};
