
import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import { MessageItem } from "./MessageItem";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedMessageInput } from "./EnhancedMessageInput";
import { RealtimeIndicators } from "./RealtimeIndicators";

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const { 
    messages, 
    isLoading: messagesLoading, 
    sendMessage 
  } = useMessages(conversationId);
  const { 
    conversation, 
    otherParticipant, 
    item, 
    isLoading: detailsLoading 
  } = useConversationDetails(conversationId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (detailsLoading) {
    return (
      <div className="h-full p-4">
        <div className="border-b pb-3 mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-2/3 ml-auto" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="border-b p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            {otherParticipant?.profile?.avatar_url ? (
              <img 
                src={otherParticipant.profile.avatar_url} 
                alt={otherParticipant.profile.username || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500">
                {(otherParticipant?.profile?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">
              {otherParticipant?.profile?.username || "User"}
            </h3>
            {item && (
              <p className="text-xs text-gray-500">
                About: {item.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem 
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced Message input with emoji support */}
      <EnhancedMessageInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSendMessage}
        placeholder="Type a message..."
        showTypingIndicator={true}
      />
      
      {/* Real-time indicators */}
      <div className="px-3 py-1 border-t bg-gray-50">
        <RealtimeIndicators 
          conversationId={conversationId}
          showOnlineStatus={true}
          showTypingIndicator={true}
        />
      </div>
    </div>
  );
}
