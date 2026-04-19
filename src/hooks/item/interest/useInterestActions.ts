
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "../utils/authCheck";
import { useToast } from "@/hooks/use-toast";

export const useInterestActions = (
  setShowInterest: (show: boolean) => void,
  fetchInterestedUsersInternal: (numericId: number) => Promise<any>
) => {
  const { checkAuth } = useAuthCheck();
  const { toast } = useToast();

  const handleShowInterest = async (id: string, userId: string | undefined | null) => {
    if (!await checkAuth("show interest in this item")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    const wasInterested = await checkExistingInterest(numericId, userId);
    setShowInterest(!wasInterested);
    
    try {
      if (wasInterested) {
        await removeInterest(numericId, userId);
        await fetchInterestedUsersInternal(numericId);
      } else {
        await addInterest(numericId, userId);
        await fetchInterestedUsersInternal(numericId);
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      setShowInterest(wasInterested);
      
      toast({
        title: t('post.error', 'Error'),
        description: t('interactions.interest_error', 'Failed to update interest status. Please try again.'),
        variant: "destructive",
      });
    }
  };

  return { handleShowInterest };
};

const checkExistingInterest = async (itemId: number, userId: string) => {
  const { data } = await supabase
    .from('interests')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();
  return !!data;
};

const removeInterest = async (itemId: number, userId: string) => {
  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId);
    
  if (error) throw error;
};

const addInterest = async (itemId: number, userId: string) => {
  const { error } = await supabase
    .from('interests')
    .insert([{ user_id: userId, item_id: itemId }]);
    
  if (error) throw error;
};
