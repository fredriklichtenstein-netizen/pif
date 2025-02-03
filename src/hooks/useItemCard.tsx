import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Comment } from "@/types/comment";
import { Button } from "@/components/ui/button";

export const useItemCard = (id: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
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

  const handleCommentToggle = async () => {
    if (!await checkAuth("comment on this item")) return;
    setShowComments(!showComments);
  };

  const handleMessage = async (e: React.MouseEvent) => {
    if (!await checkAuth("message the owner")) {
      e.preventDefault();
      return;
    }
    navigate(`/messages`);
  };

  const handleShare = async () => {
    if (!await checkAuth("share this item")) return;
    const url = window.location.href;
    window.open(`https://facebook.com/share?url=${url}`, '_blank');
    toast({
      title: "Shared!",
      description: "Item shared on Facebook",
    });
  };

  const handleReport = async () => {
    if (!await checkAuth("report this item")) return;
    toast({
      title: "Item reported",
      description: "Thank you for helping keep our community safe. We'll review this item.",
    });
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
    showComments,
    comments,
    showInterest,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  };
};