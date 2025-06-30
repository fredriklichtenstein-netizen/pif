
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageComposer } from './MessageComposer';
import { MessageThread } from './MessageThread';
import { RealtimeIndicator } from './RealtimeIndicator';
import { useRealtimeMessages } from '@/hooks/messaging/useRealtimeMessages';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedConversationViewProps {
  conversationId: string;
  recipientName: string;
  recipientAvatar?: string;
  onBack?: () => void;
}

export function EnhancedConversationView({ 
  conversationId, 
  recipientName, 
  recipientAvatar,
  onBack 
}: EnhancedConversationViewProps) {
  const {
    messages,
    typingUsers,
    isConnected,
    loading,
    sendMessage,
    sendTypingIndicator,
    markAsRead
  } = useRealtimeMessages(conversationId);
  
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 3000);
  };

  const handleSendMessage = async (content: string, mentions?: string[]) => {
    // Stop typing indicator
    setIsTyping(false);
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await sendMessage(content, mentions);
  };

  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleThreadReply = async (parentId: string, content: string, mentions?: string[]) => {
    // In a real implementation, this would create a threaded reply
    await sendMessage(`Reply to ${parentId}: ${content}`, mentions);
  };

  if (loading) {
    return (
      <Card className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded ml-8"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>{recipientName[0]}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold">{recipientName}</h3>
              <RealtimeIndicator />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.thread_id ? (
                <MessageThread
                  parentMessage={{
                    id: message.id,
                    content: message.content,
                    sender: {
                      id: message.sender_id,
                      name: message.sender?.name || 'Unknown',
                      avatar: message.sender?.avatar_url
                    },
                    createdAt: message.created_at,
                    mentions: message.mentions
                  }}
                  replies={[]} // In real implementation, fetch thread replies
                  onReply={(content, mentions) => handleThreadReply(message.id, content, mentions)}
                  isExpanded={expandedThreads.has(message.id)}
                  onToggle={() => toggleThread(message.id)}
                />
              ) : (
                <div className={`flex ${message.sender_id === 'current_user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-3 max-w-[70%] ${
                    message.sender_id === 'current_user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>{message.sender?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <Card className={`p-3 ${
                      message.sender_id === 'current_user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {message.mentions && message.mentions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.mentions.map((mention, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              @{mention}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-between mt-2 text-xs ${
                        message.sender_id === 'current_user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {message.read_at && (
                          <span>✓✓</span>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {typingUsers[0].name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Composer */}
      <div className="p-4 border-t">
        <MessageComposer
          onSendMessage={handleSendMessage}
          placeholder={`Message ${recipientName}...`}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
