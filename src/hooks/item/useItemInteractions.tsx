import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const useItemInteractions = (id: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAuth = async (action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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
    
    setShowInterest(!showInterest);
    toast({
      title: showInterest ? "Interest removed" : "Interest shown!",
      description: showInterest 
        ? "You will no longer receive updates about this item" 
        : "The owner will be notified of your interest",
    });
  };

  const handleLike = async () => {
    if (!await checkAuth("like this item")) return;
    setIsLiked(!isLiked);
  };

  const handleBookmark = async () => {
    if (!await checkAuth("bookmark this item")) return;

    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from saved items" : "Saved to your items",
      description: isBookmarked 
        ? "This item has been removed from your saved items" 
        : "You can find this item in your saved items",
    });
  };

  return {
    isLiked,
    showInterest,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
  };
};