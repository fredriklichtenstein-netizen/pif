
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interestedUsersError, setInterestedUsersError] = useState<Error | null>(null);
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
        
        // Get total interests count
        const { count, error: countError } = await supabase
          .from('interests')
          .select('id', { count: 'exact', head: true })
          .eq('item_id', numericId);
        
        if (!countError) {
          setInterestsCount(count || 0);
        }
      } catch (error) {
        console.error("Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterests();
  }, [id, userId]);

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest in this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    // Create a local copy of the current state before making updates
    const wasInterested = showInterest;
    const previousCount = interestsCount;
    
    // Optimistically update UI
    setShowInterest(!wasInterested);
    setInterestsCount(prev => wasInterested ? Math.max(0, prev - 1) : prev + 1);
    
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
      
      toast({
        title: "Error",
        description: "Failed to update interest status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Fetch users who are interested in this item
  const fetchInterestedUsers = async (): Promise<User[]> => {
    // Reset error state when starting a new fetch
    setInterestedUsersError(null);
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setInterestedUsersError(new Error("Invalid item ID"));
      return [];
    }
    
    try {
      console.log(`Fetching interested users for item ${numericId}`);
      
      // Add a timeout to the Supabase query
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Get user IDs who showed interest in this item
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select('user_id')
        .eq('item_id', numericId)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
        
      if (interestsError) {
        console.error('Error fetching interest data:', interestsError);
        setInterestedUsersError(new Error(interestsError.message));
        return [];
      }
      
      if (!interestsData || interestsData.length === 0) {
        console.log('No interested users found');
        return [];
      }
      
      console.log(`Found ${interestsData.length} interested users`);
      
      // Get unique user IDs
      const userIds = [...new Set(interestsData.map(interest => interest.user_id))];
      
      // Fetch user profiles
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000); // 10 second timeout
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds)
        .abortSignal(controller2.signal);
      
      clearTimeout(timeoutId2);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setInterestedUsersError(new Error(profilesError.message));
        return [];
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('No profile data found for interested users');
        return [];
      }
      
      console.log(`Retrieved ${profilesData.length} profiles for interested users`);
      
      // Map to User type
      return profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
    } catch (error: any) {
      console.error('Error fetching interested users:', error);
      
      // Set a more user-friendly error message
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.' 
        : error.message || 'Failed to load interested users';
      
      setInterestedUsersError(new Error(errorMessage));
      return [];
    }
  };

  return {
    showInterest,
    interestsCount,
    loading,
    interestedUsersError,
    handleShowInterest,
    fetchInterestedUsers
  };
};
