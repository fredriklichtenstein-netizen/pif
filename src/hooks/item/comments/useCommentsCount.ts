
import { supabase } from "@/integrations/supabase/client";

export const useCommentsCount = () => {
  // Get comments count for an item
  const fetchCommentsCount = async (itemId: string): Promise<number> => {
    if (!itemId) return 0;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('item_id', numericItemId);
      
      if (error) {
        console.error("Error fetching comments count:", error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching comments count:", error);
      return 0;
    }
  };
  
  return { fetchCommentsCount };
};
