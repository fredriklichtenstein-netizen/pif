
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useAuthCheck } from "./utils/authCheck";

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export const useLikes = (itemId: string, userId?: string) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likers, setLikers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkAuth } = useAuthCheck();

  // Check if item is liked by current user and get likes count
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!itemId) return;
      setLoading(true);

      try {
        // Get likes count
        const { data: count, error: countError } = await supabase.rpc(
          'get_item_likes_count',
          { item_id_param: parseInt(itemId) }
        );

        if (countError) throw countError;
        setLikesCount(count || 0);

        // If user is logged in, check if they liked the item
        if (userId) {
          const { data: liked, error: likedError } = await supabase.rpc(
            'has_user_liked_item',
            { item_id_param: parseInt(itemId) }
          );

          if (likedError) throw likedError;
          setIsLiked(liked || false);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLikeStatus();
  }, [itemId, userId]);

  // Toggle like status
  const handleLike = async () => {
    if (!itemId || loading) return;
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuth("like this item");
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('item_id', parseInt(itemId))
          .eq('user_id', userId);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount((prev) => Math.max(prev - 1, 0));
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            item_id: parseInt(itemId),
            user_id: userId,
          });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users who liked the item
  const fetchLikers = async (): Promise<User[]> => {
    if (!itemId) return [];

    try {
      // First get the user IDs from likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('user_id')
        .eq('item_id', parseInt(itemId));

      if (likesError) throw likesError;
      if (!likesData || likesData.length === 0) return [];

      // Get the user IDs
      const userIds = likesData.map(like => like.user_id);

      // Then fetch the profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      if (!profilesData) return [];

      // Map profiles to User objects
      const fetchedLikers = profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url
      }));

      setLikers(fetchedLikers);
      return fetchedLikers;
    } catch (error) {
      console.error("Error fetching likers:", error);
      return [];
    }
  };

  return {
    isLiked,
    likesCount,
    likers,
    loading,
    handleLike,
    fetchLikers,
  };
};
