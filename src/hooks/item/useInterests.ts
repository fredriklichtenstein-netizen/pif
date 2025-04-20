
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const [interestedUsers, setInterestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [interestedUsersError, setInterestedUsersError] = useState<Error | null>(null);
  const [fetchAttemptCount, setFetchAttemptCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  // Initial fetch of interests
  useEffect(() => {
    const fetchInterests = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Check if current user has shown interest in this item
        if (userId) {
          const { data: userInterest, error: userInterestError } = await supabase
            .from('interests')
            .select('id')
            .eq('user_id', userId)
            .eq('item_id', numericId)
            .maybeSingle();
            
          if (!userInterestError) {
            setShowInterest(!!userInterest);
          }
        }
        
        // Get interested users to have an accurate count
        await fetchInterestedUsersInternal(numericId);
      } catch (error) {
        console.error("Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterests();
  }, [id, userId]);

  // Internal version to be used within the hook
  const fetchInterestedUsersInternal = async (numericId: number): Promise<User[]> => {
    try {
      // Get user IDs who showed interest in this item
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
      
      // Update the count based on actual data
      setInterestsCount(interestsData.length);
      
      // Get unique user IDs
      const userIds = [...new Set(interestsData.map(interest => interest.user_id))];
      
      // Fetch user profiles
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
      
      // Map to User type
      const users = profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
      
      // Update local state
      setInterestedUsers(users);
      
      return users;
    } catch (error) {
      console.error('Error in fetchInterestedUsersInternal:', error);
      return [];
    }
  };

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest in this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    // Create a local copy of the current state before making updates
    const wasInterested = showInterest;
    const previousCount = interestsCount;
    const previousUsers = [...interestedUsers];
    
    // Optimistically update UI
    setShowInterest(!wasInterested);
    
    try {
      if (wasInterested) {
        // Remove interest
        const { error } = await supabase
          .from('interests')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) {
          throw error;
        }
        
        // Update the count and users list
        await fetchInterestedUsersInternal(numericId);
        
        toast({
          title: "Interest removed",
          description: "You are no longer interested in this item",
        });
      } else {
        // Add interest
        const { error } = await supabase
          .from('interests')
          .insert([
            { user_id: userId, item_id: numericId }
          ]);
          
        if (error) {
          throw error;
        }
        
        // Update the count and users list
        await fetchInterestedUsersInternal(numericId);
        
        toast({
          title: "Interest shown",
          description: "You've shown interest in this item",
        });
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      // Revert optimistic updates on error
      setShowInterest(wasInterested);
      setInterestsCount(previousCount);
      setInterestedUsers(previousUsers);
      
      toast({
        title: "Error",
        description: "Failed to update interest status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Fetch users who are interested in this item - public method for components
  const fetchInterestedUsers = async (): Promise<User[]> => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset error state when starting a new fetch
    setInterestedUsersError(null);
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setInterestedUsersError(new Error("Invalid item ID"));
      return [];
    }
    
    try {
      console.log(`Fetching interested users for item ${numericId} (attempt: ${fetchAttemptCount + 1})`);
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Set a timeout to abort the request if it takes too long (15 seconds)
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000);
      
      const users = await fetchInterestedUsersInternal(numericId);
      
      clearTimeout(timeoutId);
      
      // Reset fetch attempt count on success
      setFetchAttemptCount(0);
      
      return users;
    } catch (error: any) {
      console.error('Error fetching interested users:', error);
      
      // If the request was aborted due to timeout, increment the attempt count
      if (error.name === 'AbortError') {
        const newAttemptCount = fetchAttemptCount + 1;
        setFetchAttemptCount(newAttemptCount);
        
        // Set appropriate error message
        const errorMessage = newAttemptCount >= 3
          ? 'Failed to load interested users after multiple attempts. Please try again later.'
          : 'Request timed out. Retrying...';
        
        setInterestedUsersError(new Error(errorMessage));
      } else {
        // For other errors, set the error message
        setInterestedUsersError(new Error(error.message || 'Failed to load interested users'));
      }
      
      return interestedUsers; // Return the current list on error
    }
  };

  return {
    showInterest,
    interestsCount,
    interestedUsers,
    loading,
    interestedUsersError,
    handleShowInterest,
    fetchInterestedUsers
  };
};
