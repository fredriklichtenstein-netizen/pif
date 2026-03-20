
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "./useGlobalAuth";
import { useToast } from "./use-toast";

export type FollowUser = {
  id: string;
  name: string;
  avatar?: string;
};

export const useFollows = () => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Toggle follow status for a user
  const toggleFollow = async (userToFollow: string) => {
    if (!user) return false;
    
    setLoading(true);
    
    try {
      // Check if already following
      const { data: isFollowing } = await supabase.rpc(
        'is_following',
        { p_following_id: userToFollow }
      );
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: userToFollow });
          
        if (error) throw error;
        
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
        
        return false;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: userToFollow });
          
        if (error) throw error;
        
        toast({
          title: "Following",
          description: "You are now following this user",
        });
        
        return true;
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user is following another user
  const checkFollowStatus = async (userToCheck: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc(
        'is_following',
        { follower: user.id, following: userToCheck }
      );
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };
  
  // Get follower count for a user
  const getFollowerCount = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc(
        'get_follower_count',
        { user_id: userId }
      );
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error getting follower count:", error);
      return 0;
    }
  };
  
  // Get following count for a user
  const getFollowingCount = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc(
        'get_following_count',
        { user_id: userId }
      );
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error getting following count:", error);
      return 0;
    }
  };
  
  return {
    loading,
    toggleFollow,
    checkFollowStatus,
    getFollowerCount,
    getFollowingCount
  };
};
