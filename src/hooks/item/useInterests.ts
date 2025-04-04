
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
          .select('id', { count: 'exact' })
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
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return [];
    
    try {
      // Get user IDs who showed interest in this item
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select('user_id')
        .eq('item_id', numericId);
        
      if (interestsError || !interestsData || interestsData.length === 0) return [];
      
      // Get unique user IDs
      const userIds = [...new Set(interestsData.map(interest => interest.user_id))];
      
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
        
      if (profilesError || !profilesData) return [];
      
      // Map to User type
      return profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
    } catch (error) {
      console.error('Error fetching interested users:', error);
      return [];
    }
  };

  return {
    showInterest,
    interestsCount,
    loading,
    handleShowInterest,
    fetchInterestedUsers
  };
};
