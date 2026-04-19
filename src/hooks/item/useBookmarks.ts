
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useTranslation } from "react-i18next";

export const useBookmarks = (id: string, userId?: string | null) => {
  const demoStore = useDemoInteractionsStore();
  const demoIsBookmarked = demoStore.isBookmarked(id);
  
  const [isBookmarked, setIsBookmarked] = useState(DEMO_MODE ? demoIsBookmarked : false);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();
  const { t } = useTranslation();

  useEffect(() => {
    if (DEMO_MODE) {
      setIsBookmarked(demoIsBookmarked);
    }
  }, [demoIsBookmarked]);

  useEffect(() => {
    if (DEMO_MODE) return;
    
    const fetchBookmarks = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId) || !userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: bookmark, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', numericId)
          .maybeSingle();
          
        if (!bookmarkError) {
          setIsBookmarked(!!bookmark);
        }
      } catch (error) {
        console.error("Error fetching bookmark status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [id, userId]);

  const handleBookmark = async () => {
    if (DEMO_MODE) {
      demoStore.toggleBookmark(id);
      return;
    }
    
    if (!await checkAuth(t('interactions.bookmark_action'))) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) throw error;
        
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert([
            { user_id: userId, item_id: numericId }
          ]);
          
        if (error) throw error;
        
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: t('post.error'),
        description: t('interactions.bookmark_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isBookmarked,
    loading,
    handleBookmark,
  };
};
