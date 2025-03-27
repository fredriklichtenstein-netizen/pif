
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import { User, extractUserFromProfile } from "./utils/userUtils";

export const useLikes = (id: string, userId?: string | null) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    const fetchLikes = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      const { data: likesData, error: likesError } = await supabase.rpc(
        'get_item_likes_count',
        { item_id_param: numericId }
      );
      
      if (!likesError && likesData !== null) {
        setLikesCount(likesData);
      }
      
      if (userId) {
        const { data: hasLiked, error: likedError } = await supabase.rpc(
          'has_user_liked_item',
          { item_id_param: numericId }
        );
        
        if (!likedError && hasLiked !== null) {
          setIsLiked(hasLiked);
        }
      }
    };
    
    fetchLikes();
  }, [id, userId]);

  const fetchLikers = useCallback(async (): Promise<User[]> => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return [];
    
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('item_id', numericId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching likers:', error);
        return [];
      }
      
      return data.map(like => {
        // Ensure profiles exists and is properly typed
        const profile = like.profiles || {};
        return extractUserFromProfile(profile, like.user_id);
      });
    } catch (error) {
      console.error('Error fetching likers:', error);
      return [];
    }
  }, [id]);

  const handleLike = async () => {
    if (!await checkAuth("like this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('user_id')
      .eq('id', numericId)
      .single();
    
    if (itemError) {
      console.error('Error fetching item:', itemError);
      return;
    }
    
    if (item.user_id === userId) {
      console.log('Cannot like your own post');
      return;
    }
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) throw error;
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([
            { user_id: userId, item_id: numericId }
          ]);
          
        if (error) throw error;
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update your like. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isLiked,
    likesCount,
    handleLike,
    fetchLikers,
  };
};
