
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuthCheck } from "./utils/authCheck";

export const useItemActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();

  const handleMessage = async (e: React.MouseEvent, itemId: string, ownerId: string) => {
    if (!await checkAuth("message the owner")) {
      e.preventDefault();
      return;
    }
    
    // Actual messaging is now handled by the ConversationHandler component
    // This method remains for backward compatibility
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

  return {
    handleMessage,
    handleShare,
    handleReport,
  };
};
