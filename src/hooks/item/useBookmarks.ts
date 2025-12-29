
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";

export const useBookmarks = (id: string, userId?: string | null) => {
  const demoStore = useDemoInteractionsStore();
  const demoIsBookmarked = demoStore.isBookmarked(id);
  
  const [isBookmarked, setIsBookmarked] = useState(DEMO_MODE ? demoIsBookmarked : false);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  // Sync demo state
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
    // Demo mode: toggle locally
    if (DEMO_MODE) {
      const newState = demoStore.toggleBookmark(id);
      toast({
        title: newState ? "Saved to your items" : "Removed from saved items",
        description: newState 
          ? "You can find this item in your saved items" 
          : "This item has been removed from your saved items",
      });
      return;
    }
    
    if (!await checkAuth("bookmark this item")) return;
    
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
