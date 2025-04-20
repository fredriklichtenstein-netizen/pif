
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import type { User } from "./utils/userUtils";

export const useLikes = (id: string, userId?: string | null) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likers, setLikers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  // Initial fetch of like status and count
  useEffect(() => {
    const fetchLikes = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Check if user has liked this item
        if (userId) {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('item_id', numericId)
            .maybeSingle();

          if (!likeError) {
            setIsLiked(!!likeData);
          }
        }

        // Fetch likers to get the accurate count and user list
        await fetchLikersInternal(numericId);
      } catch (error) {
        console.error("Error fetching likes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [id, userId]);

  // Internal function to fetch likers and update count
  const fetchLikersInternal = async (numericId: number): Promise<User[]> => {
    try {
      // Get user IDs who liked this item
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('user_id')
        .eq('item_id', numericId);
        
      if (likesError) {
        console.error('Error fetching likes data:', likesError);
        return [];
      }
      
      if (!likesData || likesData.length === 0) {
        setLikesCount(0);
        setLikers([]);
        return [];
      }
      
      // Update the count based on actual data
      setLikesCount(likesData.length);
      
      // Get unique user IDs
      const userIds = [...new Set(likesData.map(like => like.user_id))];
      
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
        setLikers([]);
        return [];
      }
      
      // Map to User type
      const users = profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
      
      // Update local state
      setLikers(users);
      
      return users;
    } catch (error) {
      console.error('Error in fetchLikersInternal:', error);
      return [];
    }
  };

  const handleLike = async () => {
    if (!await checkAuth("like this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    // Create a local copy of the current state before making updates
    const wasLiked = isLiked;
    const previousCount = likesCount;
    const previousLikers = [...likers];
    
    // Optimistically update UI
    setIsLiked(!wasLiked);
    
    try {
      if (wasLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert([
            { user_id: userId, item_id: numericId }
          ]);
          
        if (error) throw error;
      }
      
      // Fetch updated likes data
      await fetchLikersInternal(numericId);
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic updates on error
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      setLikers(previousLikers);
      
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Public method for components to fetch likers
  const fetchLikers = async (): Promise<User[]> => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return [];
    
    try {
      return await fetchLikersInternal(numericId);
    } catch (error) {
      console.error('Error in fetchLikers:', error);
      return likers; // Return current likers on error
    }
  };

  return {
    isLiked,
    likesCount,
    likers,
    loading,
    handleLike,
    fetchLikers
  };
};
