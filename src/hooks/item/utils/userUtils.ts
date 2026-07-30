
import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * Utility function to safely extract user data from profile object
 * and to format name as "First Last". Callers rendering this in tight
 * spaces should truncate visually via CSS rather than shortening the name.
 */
export const extractUserFromProfile = (
  userProfile: Record<string, any> | null,
  fallbackId: string
): User => {
  if (!userProfile) {
    return {
      id: fallbackId,
      name: "Anonymous",
      avatar: undefined,
    };
  }

  // Safely access profile properties
  const firstName = "first_name" in userProfile
    ? (userProfile.first_name as string || "")
    : "";

  const lastName = "last_name" in userProfile
    ? userProfile.last_name as string || ""
    : "";

  const username = "username" in userProfile
    ? (userProfile.username as string || "")
    : "";

  // Format name with fallback hierarchy
  let displayName = "";
  
  if (firstName && lastName.length > 0) {
    // Preferred: "First Last"
    displayName = `${firstName} ${lastName}`;
  } else if (firstName) {
    // Fallback: Just first name
    displayName = firstName;
  } else if (username) {
    // Fallback: Username
    displayName = username;
  } else {
    // Last resort: Anonymous
    displayName = "Anonymous";
  }

  // Get ID and avatar
  const id = "id" in userProfile ? userProfile.id as string : fallbackId;

  const avatarUrl = "avatar_url" in userProfile
    ? (userProfile.avatar_url as string) || undefined
    : undefined;

  return {
    id,
    name: displayName,
    avatar: avatarUrl
  };
};
