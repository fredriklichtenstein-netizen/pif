
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConversationHandlerProps {
  itemId: string;
  receiverId: string | undefined;
  children: (props: { handleClick: (e: React.MouseEvent) => void, isLoading: boolean }) => React.ReactNode;
}

export function ConversationHandler({ 
  itemId, 
  receiverId, 
  children 
}: ConversationHandlerProps) {
  const [isMessaging, setIsMessaging] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      setIsMessaging(true);
      
      if (!receiverId) {
        throw new Error("Cannot message this user");
      }
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate('/auth');
        return;
      }
      
      // Create or get existing conversation
      const { data, error } = await supabase.rpc(
        'create_conversation',
        { 
          item_id_param: parseInt(itemId, 10),
          receiver_id_param: receiverId
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
    } finally {
      setIsMessaging(false);
    }
  };

  return children({
    handleClick: handleStartConversation,
    isLoading: isMessaging
  });
}
