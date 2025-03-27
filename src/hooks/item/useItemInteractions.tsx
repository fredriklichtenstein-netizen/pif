
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useGlobalAuth } from "../useGlobalAuth";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

export const useItemInteractions = (id: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useGlobalAuth();
  
  useEffect(() => {
    const fetchInteractions = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      const { data: likesData, error: likesError } = await supabase.rpc(
        'get_item_likes_count',
        { item_id_param: numericId }
      );
      
      if (!likesError && likesData !== null) {
        setLikesCount(likesData);
      }
      
      const { data: interestsData, error: interestsError } = await supabase.rpc(
        'get_item_interests_count',
        { item_id_param: numericId }
      );
      
      if (!interestsError && interestsData !== null) {
        setInterestsCount(interestsData);
      }
      
      if (user) {
        const { data: hasLiked, error: likedError } = await supabase.rpc(
          'has_user_liked_item',
          { item_id_param: numericId }
        );
        
        if (!likedError && hasLiked !== null) {
          setIsLiked(hasLiked);
        }
        
        const { data: hasInterest, error: interestError } = await supabase.rpc(
          'has_user_shown_interest',
          { item_id_param: numericId }
        );
        
        if (!interestError && hasInterest !== null) {
          setShowInterest(hasInterest);
        }
        
        const { data: bookmark, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', numericId)
          .maybeSingle();
          
        if (!bookmarkError) {
          setIsBookmarked(!!bookmark);
        }
      }
    };
    
    fetchInteractions();
  }, [id, user]);

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
        
        // Safely access properties with fallbacks
        const firstName = typeof profile === 'object' && profile !== null ? (profile.first_name || '') : '';
        const lastName = typeof profile === 'object' && profile !== null ? (profile.last_name || '') : '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous';
        
        // Safely get the ID, falling back to user_id if profile.id is not available
        const id = typeof profile === 'object' && profile !== null && 'id' in profile ? profile.id : like.user_id;
        
        // Safely get avatar URL or generate a default one
        const avatarUrl = typeof profile === 'object' && profile !== null && 'avatar_url' in profile
          ? profile.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
        
        return {
          id: id as string,
          name: fullName,
          avatar: avatarUrl as string
        };
      });
    } catch (error) {
      console.error('Error fetching likers:', error);
      return [];
    }
  }, [id]);

  const checkAuth = async (action: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: `Please sign in to ${action}`,
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Sign in
          </Button>
        ),
      });
      return false;
    }
    return true;
  };

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return;
    
    try {
      if (showInterest) {
        const { error } = await supabase
          .from('interests')
          .delete()
          .eq('user_id', user.id)
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
            { user_id: user.id, item_id: numericId }
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

  const handleLike = async () => {
    if (!await checkAuth("like this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return;
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('user_id')
      .eq('id', numericId)
      .single();
    
    if (itemError) {
      console.error('Error fetching item:', itemError);
      return;
    }
    
    if (item.user_id === user.id) {
      console.log('Cannot like your own post');
      return;
    }
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', numericId);
          
        if (error) throw error;
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([
            { user_id: user.id, item_id: numericId }
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

  const handleBookmark = async () => {
    if (!await checkAuth("bookmark this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return;
    
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', numericId);
          
        if (error) throw error;
        
        setIsBookmarked(false);
        
        toast({
          title: "Removed from saved items",
          description: "This item has been removed from your saved items",
        });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([
            { user_id: user.id, item_id: numericId }
          ]);
          
        if (error) throw error;
        
        setIsBookmarked(true);
        
        toast({
          title: "Saved to your items",
          description: "You can find this item in your saved items",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update your bookmarks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
    fetchLikers,
  };
};
