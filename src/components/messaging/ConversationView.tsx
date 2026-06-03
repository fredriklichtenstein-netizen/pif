
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
import { ProfilePopup } from "./ProfilePopup";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ConversationViewProps {
  conversationId: string;
  onBack?: () => void;
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false);
  const { t } = useTranslation();
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    deleteMessage,
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

  // Role label: piffer = item owner; receiver = the other side.
  // item.postedBy.id is populated with items.user_id by useConversationDetails.
  const itemOwnerId = item?.postedBy?.id;
  const isCurrentUserPiffer = !!itemOwnerId && itemOwnerId === currentUserId;
  const roleLabel = item
    ? isCurrentUserPiffer
      ? t("messages.role_you_pif", {
          defaultValue: "Du piffar: {{title}}",
          title: item.title,
        })
      : t("messages.role_you_receive", {
          defaultValue: "Du tar emot: {{title}}",
          title: item.title,
        })
    : null;

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
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 -ml-1"
              onClick={onBack}
              aria-label={t("common.back", { defaultValue: "Tillbaka" })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setHeaderProfileOpen(true)}
            className="flex-shrink-0"
            aria-label={otherName}
          >
            <UserAvatar
              src={otherParticipant?.profile?.avatar_url}
              name={otherName}
              initial={otherInitial}
              className="h-10 w-10"
            />
          </button>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{otherName}</h3>
            {roleLabel && (
              <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
            )}
          </div>
        </div>
      </div>

      <ProfilePopup
        open={headerProfileOpen}
        onOpenChange={setHeaderProfileOpen}
        profile={otherParticipant?.profile}
        userId={otherParticipant?.user_id}
        displayName={otherName}
        initial={otherInitial}
      />

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
                otherProfile={otherParticipant?.profile}
                otherUserId={otherParticipant?.user_id}
                otherDisplayName={otherName}
                otherInitial={otherInitial}
                itemId={item?.id}
                onDelete={deleteMessage}
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
