import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronRight, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EnhancedMessageInput } from "./EnhancedMessageInput";
import { RealtimeIndicators } from "./RealtimeIndicators";

interface ThreadMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  parentId?: string;
  replies?: ThreadMessage[];
  replyCount: number;
}

interface ThreadedMessagesProps {
  messages: ThreadMessage[];
  currentUserId: string;
  onSendMessage: (content: string, parentId?: string) => void;
  onSendReply: (content: string, parentId: string) => void;
}

const MessageThread = ({ 
  message, 
  currentUserId, 
  onSendReply, 
  level = 0 
}: { 
  message: ThreadMessage; 
  currentUserId: string; 
  onSendReply: (content: string, parentId: string) => void;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const isOwnMessage = message.senderId === currentUserId;
  const hasReplies = message.replies && message.replies.length > 0;

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendReply(replyContent.trim(), message.id);
      setReplyContent("");
      setShowReplyInput(false);
      setIsExpanded(true);
    }
  };

  return (
    <div className={`mb-4 ${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                {message.senderAvatar ? (
                  <img 
                    src={message.senderAvatar} 
                    alt={message.senderName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">
                    {message.senderName[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {message.senderName}
              </span>
            </div>
          )}
          
          <p className="text-sm">{message.content}</p>
          
          <div className={`text-xs mt-2 flex items-center justify-between ${
            isOwnMessage ? 'text-white/70' : 'text-gray-500'
          }`}>
            <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
            <RealtimeIndicators 
              conversationId={message.id}
              messageId={message.id}
              showOnlineStatus={false}
              showTypingIndicator={false}
            />
          </div>
        </div>
      </div>

      {/* Reply controls */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="text-xs h-7 px-2"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Reply
        </Button>
        
        {hasReplies && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7 px-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </Button>
        )}
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="mb-4">
          <Card className="border-gray-200">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm text-gray-600">
                Replying to {isOwnMessage ? 'yourself' : message.senderName}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EnhancedMessageInput
                value={replyContent}
                onChange={setReplyContent}
                onSend={handleSendReply}
                placeholder={`Reply to ${message.senderName}...`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nested replies */}
      {isExpanded && hasReplies && (
        <div className="space-y-2">
          {message.replies?.map(reply => (
            <MessageThread
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              onSendReply={onSendReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ThreadedMessages = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendReply
}: ThreadedMessagesProps) => {
  const [newMessage, setNewMessage] = useState("");

  // Filter out top-level messages (no parentId)
  const topLevelMessages = messages.filter(msg => !msg.parentId);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {topLevelMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          topLevelMessages.map(message => (
            <MessageThread
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onSendReply={onSendReply}
            />
          ))
        )}
      </div>

      {/* New message input */}
      <div className="border-t">
        <EnhancedMessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          placeholder="Type a message..."
          showTypingIndicator={true}
        />
      </div>
    </div>
  );
};