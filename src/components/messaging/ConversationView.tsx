
import { useState, useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import { MessageItem } from "./MessageItem";
import { useAuth } from "@/hooks/useAuth";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedMessageInput } from "./EnhancedMessageInput";
import { useTranslation } from "react-i18next";
import { resolveDisplayName, resolveAvatarInitial } from "@/utils/displayName";
import { UserAvatar } from "./UserAvatar";

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const { t } = useTranslation();
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
  } = useMessages(conversationId);
  const {
    otherParticipant,
    item,
    isLoading: detailsLoading,
  } = useConversationDetails(conversationId);

  const fallbackName = t("messages.unknown_user");
  const fallbackInitial = fallbackName.charAt(0).toUpperCase();
  const otherName = resolveDisplayName(otherParticipant?.profile, fallbackName);
  const otherInitial = resolveAvatarInitial(otherParticipant?.profile, fallbackInitial);

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
    <div className="flex flex-col h-full min-h-0">
      {/* Conversation header — sticky/fixed inside the column */}
      <div className="border-b p-3 bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
            {otherParticipant?.profile?.avatar_url ? (
              <img
                src={otherParticipant.profile.avatar_url}
                alt={otherName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground font-medium">
                {otherInitial}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{otherName}</h3>
            {item && (
              <p className="text-xs text-muted-foreground truncate">
                {t("interactions.about_item", { title: item.title })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable message list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{t("interactions.no_messages")}</p>
            <p className="text-sm mt-2">{t("interactions.send_to_start")}</p>
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

      {/* Fixed message input at the bottom of the column */}
      <div className="flex-shrink-0">
        <EnhancedMessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          placeholder={t("messages.type_message")}
        />
      </div>
    </div>
  );
}
