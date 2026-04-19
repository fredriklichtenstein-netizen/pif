
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAuth } from '../useGlobalAuth';
import { useTranslation } from 'react-i18next';

export function useItemBookmark(itemId: number | string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  
  // Ensure itemId is numeric for database operations
  const numericItemId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
  
  // Check if the item is bookmarked when the component mounts
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', numericItemId)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error checking bookmark status:', error);
          return;
        }
        
        setIsBookmarked(!!data);
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && numericItemId) {
      checkBookmarkStatus();
    }
  }, [numericItemId, user]);
  
  // Toggle bookmark status
  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: t('interactions.auth_required_title'),
        description: t('interactions.auth_required_save_items'),
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', numericItemId);
          
        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            item_id: numericItemId
          });
          
        if (error) throw error;
      }
      
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast({
        title: t('post.error'),
        description: t('interactions.bookmark_update_error'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isBookmarked,
    isLoading,
    toggleBookmark
  };
}
