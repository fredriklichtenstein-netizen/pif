
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import { extractUserFromProfile } from "./utils/userUtils";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    const fetchInterests = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      const { data: interestsData, error: interestsError } = await supabase.rpc(
        'get_item_interests_count',
        { item_id_param: numericId }
      );
      
      if (!interestsError && interestsData !== null) {
        setInterestsCount(interestsData);
      }
      
      if (userId) {
        const { data: hasInterest, error: interestError } = await supabase.rpc(
          'has_user_shown_interest',
          { item_id_param: numericId }
        );
        
        if (!interestError && hasInterest !== null) {
          setShowInterest(hasInterest);
        }
      }
    };
    
    fetchInterests();
  }, [id, userId]);

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    try {
      if (showInterest) {
        const { error } = await supabase
          .from('interests')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) throw error;
        
        setShowInterest(false);
        setInterestsCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Interest removed",
          description: "You will no longer receive updates about this item",
        });
      } else {
        const { error } = await supabase
          .from('interests')
          .insert([
            { user_id: userId, item_id: numericId }
          ]);
          
        if (error) throw error;
        
        setShowInterest(true);
        setInterestsCount(prev => prev + 1);
        
        toast({
          title: "Interest shown!",
          description: "The owner will be notified of your interest",
        });
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      toast({
        title: "Error",
        description: "Failed to update your interest. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch users who have shown interest
  const fetchInterestedUsers = async (): Promise<User[]> => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return [];
    
    try {
      // Get the IDs of users who have shown interest
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('user_id')
        .eq('item_id', numericId);
        
      if (interestsError) throw interestsError;
      if (!interests || interests.length === 0) return [];
      
      // Get user IDs
      const userIds = interests.map(interest => interest.user_id);
      
      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      if (!profiles) return [];
      
      // Map to User objects
      return profiles.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url
      }));
    } catch (error) {
      console.error('Error fetching interested users:', error);
      return [];
    }
  };

  return {
    showInterest,
    interestsCount,
    handleShowInterest,
    fetchInterestedUsers
  };
};
