
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useNavigate } from "react-router-dom";
import { MessageItem } from "@/components/messaging/MessageItem";
import { useMessages } from "@/hooks/useMessages";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useGlobalAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { t } = useTranslation();
  
  const { 
    conversation, 
    isLoading: conversationLoading, 
    error: conversationError 
  } = useConversationDetails(id);
  
  const { 
    messages, 
    isLoading: messagesLoading, 
    error: messagesError,
    sendMessage
  } = useMessages(id);

  useEffect(() => {
    if (!messagesLoading) {
      const messagesContainer = document.getElementById("messages-container");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages, messagesLoading]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;
    
    try {
      setIsSending(true);
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.user_id !== user.id)?.profile;
  };

  const refreshMessages = async () => {
    navigate(`/messages`);
    setTimeout(() => navigate(`/conversation/${id}`), 10);
  };

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t('messages.loading_conversation')}</p>
      </div>
    );
  }

  if (conversationError || messagesError) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <NetworkStatus onRetry={refreshMessages} />
        <div className="bg-destructive/10 p-4 rounded-md mb-4">
          <p className="text-destructive">{t('messages.failed_load_conversation')}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => navigate("/messages")}
          >
            {t('nav.back_to_messages')}
          </Button>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="container max-w-md mx-auto px-4 py-2 pt-4 pb-20">
      <NetworkStatus onRetry={refreshMessages} />
      
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/messages")}
          className="mr-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            {otherParticipant?.username || t('common.conversation')}
          </h1>
          {conversation?.item && (
            <p className="text-sm text-muted-foreground">
              {t('messages.regarding')} {conversation.item.title}
            </p>
          )}
        </div>
      </div>

      <div 
        id="messages-container"
        className="flex flex-col space-y-4 h-[calc(100vh-240px)] overflow-y-auto mb-4 p-2"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t('messages.no_messages_yet')}
          </p>
        ) : (
          messages.map(message => (
            <MessageItem 
              key={message.id} 
              message={message} 
              isOwnMessage={message.sender_id === user?.id} 
            />
          ))
        )}
      </div>

      <div className="fixed bottom-14 left-0 right-0 bg-background border-t p-2">
        <div className="container max-w-md mx-auto flex">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messages.type_message')}
            className="min-h-[60px] resize-none"
            disabled={isSending}
          />
          <Button 
            className="ml-2 self-end h-10" 
            disabled={!newMessage.trim() || isSending}
            onClick={handleSendMessage}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
