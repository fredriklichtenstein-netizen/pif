
import { supabase } from "@/integrations/supabase/client";
import type { User } from "../../utils/userUtils";

export const useFetchInterestedUsers = () => {
  const fetchInterestedUsersCore = async (numericId: number): Promise<User[]> => {
    const { data: interestsData, error: interestsError } = await supabase
      .from('interests')
      .select('user_id')
      .eq('item_id', numericId);
      
    if (interestsError) {
      console.error('Error fetching interest data:', interestsError);
      return [];
    }
    
    if (!interestsData || interestsData.length === 0) {
      return [];
    }
    
    const userIds = [...new Set(interestsData.map(interest => interest.user_id))];
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }
    
    if (!profilesData || profilesData.length === 0) {
      return [];
    }
    
    return profilesData.map(profile => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
      avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
    }));
  };

  return { fetchInterestedUsersCore };
};
