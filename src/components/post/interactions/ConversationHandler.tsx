
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
          p_item_id: parseInt(itemId, 10),
          p_recipient_id: receiverId
        }
      );
      
      if (error) throw error;
      
      // Navigate to the conversation
      navigate(`/messages?conversation=${data}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: t('post.error', 'Fel'),
        description: t('interactions.conversation_start_error', 'Kunde inte starta konversation. Försök igen.'),
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
