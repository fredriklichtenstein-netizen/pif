
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Rating } from "@/types/post";

export function useRatings(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's average rating
  const { data: averageRating, isLoading: isLoadingAverage } = useQuery({
    queryKey: ['userRating', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { data, error } = await (supabase.rpc as any)(
        'get_user_average_rating', { user_id_param: userId });
      
      if (error) throw error;
      return data || 0;
    },
    enabled: !!userId,
  });

  // Submit rating
  const submitRating = useMutation({
    mutationFn: async ({ 
      ratedUserId, 
      itemId, 
      rating, 
      comment 
    }: { 
      ratedUserId: string; 
      itemId: number; 
      rating: number; 
      comment?: string; 
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('ratings')
        .insert({
          rater_id: user.id,
          rated_user_id: ratedUserId,
          item_id: itemId,
          rating,
          comment,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Tack för ditt betyg!",
        description: "Ditt betyg har sparats.",
      });
      queryClient.invalidateQueries({ queryKey: ['userRating'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara betyget.",
        variant: "destructive",
      });
    },
  });

  return {
    averageRating: averageRating || 0,
    isLoadingAverage,
    submitRating: submitRating.mutate,
    isSubmittingRating: submitRating.isPending,
  };
}
