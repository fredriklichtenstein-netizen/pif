
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";

export const useBookmarks = (id: string, userId?: string | null) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    const fetchBookmarks = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId) || !userId) return;
      
      const { data: bookmark, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', numericId)
        .maybeSingle();
        
      if (!bookmarkError) {
        setIsBookmarked(!!bookmark);
      }
    };
    
    fetchBookmarks();
  }, [id, userId]);

  const handleBookmark = async () => {
    if (!await checkAuth("bookmark this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
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
            { user_id: userId, item_id: numericId }
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
    isBookmarked,
    handleBookmark,
  };
};
