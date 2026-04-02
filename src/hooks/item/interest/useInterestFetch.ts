
import { useToast } from "@/hooks/use-toast";
import { useAbortController } from "./fetch/useAbortController";
import { useFetchInterestedUsers } from "./fetch/useFetchInterestedUsers";
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
  const { setupAbortController } = useAbortController();
  const { fetchInterestedUsersCore } = useFetchInterestedUsers();

  const fetchInterestedUsersInternal = async (numericId: number): Promise<User[]> => {
    try {
      const users = await fetchInterestedUsersCore(numericId);
      setInterestsCount(users.length);
      setInterestedUsers(users);
      return users;
    } catch (error) {
      console.error('Error in fetchInterestedUsersInternal:', error);
      return [];
    }
  };

  const fetchInterestedUsers = async (id: string): Promise<User[]> => {
    const controller = setupAbortController();
    
    setInterestedUsersError(null);
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setInterestedUsersError(new Error("Invalid item ID"));
      return [];
    }
    
    try {
      const timeoutId = setTimeout(() => {
        controller.abort();
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
