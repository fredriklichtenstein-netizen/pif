
import { formatDistanceToNow } from "date-fns";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import type { Conversation } from "@/types/messaging";
import { Link } from "react-router-dom";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  const { user } = useGlobalAuth();
  const currentUserId = user?.id;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b">
        <h3 className="font-medium">Conversations</h3>
      </div>
      <div className="divide-y">
        {conversations.map((conversation) => {
          // Find the other participant (not the current user)
          const otherParticipant = conversation.participants.find(
            p => p.user_id !== currentUserId
          );
          
          return (
            <div 
              key={conversation.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeConversationId === conversation.id ? "bg-gray-100" : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                {otherParticipant?.user_id && (
                  <Link to={`/user/${otherParticipant.user_id}`} className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium truncate">
                      {otherParticipant?.profile?.username || "User"}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conversation.last_message_text || "No messages yet"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
