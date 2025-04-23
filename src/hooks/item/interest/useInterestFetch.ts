
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "../utils/userUtils";

export const useInterestFetch = (
  setInterestedUsers: (users: User[]) => void,
  setInterestsCount: (count: number) => void,
  setLoading: (loading: boolean) => void,
  setInterestedUsersError: (error: Error | null) => void,
  setFetchAttemptCount: (count: number) => void,
  fetchAttemptCount: number,
  interestedUsers: User[]
) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInterestedUsersInternal = async (numericId: number): Promise<User[]> => {
    try {
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select('user_id')
        .eq('item_id', numericId);
        
      if (interestsError) {
        console.error('Error fetching interest data:', interestsError);
        return [];
      }
      
      if (!interestsData || interestsData.length === 0) {
        setInterestsCount(0);
        setInterestedUsers([]);
        return [];
      }
      
      setInterestsCount(interestsData.length);
      
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
        setInterestedUsers([]);
        return [];
      }
      
      const users = profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
      
      setInterestedUsers(users);
      
      return users;
    } catch (error) {
      console.error('Error in fetchInterestedUsersInternal:', error);
      return [];
    }
  };

  const fetchInterestedUsers = async (id: string): Promise<User[]> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setInterestedUsersError(null);
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setInterestedUsersError(new Error("Invalid item ID"));
      return [];
    }
    
    try {
      console.log(`Fetching interested users for item ${numericId} (attempt: ${fetchAttemptCount + 1})`);
      
      abortControllerRef.current = new AbortController();
      
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000);
      
      const users = await fetchInterestedUsersInternal(numericId);
      
      clearTimeout(timeoutId);
      
      setFetchAttemptCount(0);
      
      return users;
    } catch (error: any) {
      console.error('Error fetching interested users:', error);
      
      if (error.name === 'AbortError') {
        const newAttemptCount = fetchAttemptCount + 1;
        setFetchAttemptCount(newAttemptCount);
        
        const errorMessage = newAttemptCount >= 3
          ? 'Failed to load interested users after multiple attempts. Please try again later.'
          : 'Request timed out. Retrying...';
        
        setInterestedUsersError(new Error(errorMessage));
      } else {
        setInterestedUsersError(new Error(error.message || 'Failed to load interested users'));
      }
      
      return interestedUsers;
    }
  };

  return { fetchInterestedUsers, fetchInterestedUsersInternal };
};
