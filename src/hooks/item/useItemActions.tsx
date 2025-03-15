
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const useItemActions = () => {
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

  const handleMessage = async (e: React.MouseEvent, itemId: string, ownerId: string) => {
    if (!await checkAuth("message the owner")) {
      e.preventDefault();
      return;
    }
    
    try {
      // Create or get existing conversation
      const { data, error } = await supabase.rpc(
        'create_conversation',
        { 
          item_id_param: parseInt(itemId, 10),
          receiver_id_param: ownerId
        }
      );
      
      if (error) throw error;
      
      // Navigate to the conversation
      navigate(`/messages?conversation=${data}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to report items",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Sign in
          </Button>
        ),
      });
      return;
    }

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
