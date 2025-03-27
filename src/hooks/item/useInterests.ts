
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";

export const useInterests = (id: string, userId?: string | null) => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    const fetchInterests = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      const { data: interestsData, error: interestsError } = await supabase.rpc(
        'get_item_interests_count',
        { item_id_param: numericId }
      );
      
      if (!interestsError && interestsData !== null) {
        setInterestsCount(interestsData);
      }
      
      if (userId) {
        const { data: hasInterest, error: interestError } = await supabase.rpc(
          'has_user_shown_interest',
          { item_id_param: numericId }
        );
        
        if (!interestError && hasInterest !== null) {
          setShowInterest(hasInterest);
        }
      }
    };
    
    fetchInterests();
  }, [id, userId]);

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest")) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    try {
      if (showInterest) {
        const { error } = await supabase
          .from('interests')
          .delete()
          .eq('user_id', userId)
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
            { user_id: userId, item_id: numericId }
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

  return {
    showInterest,
    interestsCount,
    handleShowInterest,
  };
};
