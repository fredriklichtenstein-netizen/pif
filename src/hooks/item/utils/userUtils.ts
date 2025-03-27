
import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  name: string;
  avatar?: string;
};

/**
 * Utility function to safely extract user data from profile object
 */
export const extractUserFromProfile = (
  userProfile: Record<string, any> | null, 
  fallbackId: string
): User => {
  if (!userProfile) {
    return { 
      id: fallbackId, 
      name: 'Anonymous', 
      avatar: `https://ui-avatars.com/api/?name=Anonymous&background=random` 
    };
  }
  
  // Safely access profile properties
  const firstName = 'first_name' in userProfile 
    ? (userProfile.first_name as string || '') 
    : '';
  
  const lastName = 'last_name' in userProfile 
    ? (userProfile.last_name as string || '') 
    : '';
  
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous';
  
  // Get ID and avatar
  const id = 'id' in userProfile ? userProfile.id as string : fallbackId;
  
  const avatarUrl = 'avatar_url' in userProfile
    ? userProfile.avatar_url as string
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  
  return {
    id,
    name: fullName,
    avatar: avatarUrl
  };
};
