import { useState, useEffect } from "react";
import { Circle, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface RealtimeIndicatorsProps {
  conversationId: string;
  messageId?: string;
  showOnlineStatus?: boolean;
  showDeliveryStatus?: boolean;
  showTypingIndicator?: boolean;
}

interface OnlineUser {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

interface MessageStatus {
  messageId: string;
  delivered: boolean;
  read: boolean;
  readAt?: string;
}

const RealtimeIndicators = ({
  conversationId,
  messageId,
  showOnlineStatus = true,
  showDeliveryStatus = true,
  showTypingIndicator = true
}: RealtimeIndicatorsProps) => {
  const { user } = useGlobalAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messageStatus, setMessageStatus] = useState<MessageStatus | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Subscribe to presence for online status
    const presenceChannel = supabase.channel(`conversation:${conversationId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: OnlineUser[] = Object.entries(state).map(([userId, presence]: [string, any]) => ({
          userId,
          isOnline: true,
          lastSeen: presence[0]?.lastSeen || new Date().toISOString()
        }));
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        setOnlineUsers(prev => [
          ...prev.filter(u => u.userId !== key),
          { userId: key, isOnline: true, lastSeen: new Date().toISOString() }
        ]);
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        setOnlineUsers(prev => prev.map(u => 
          u.userId === key ? { ...u, isOnline: false } : u
        ));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: user.id,
            lastSeen: new Date().toISOString()
          });
        }
      });

    // Subscribe to typing indicators
    const typingChannel = supabase.channel(`conversation:${conversationId}:typing`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, isTyping } = payload;
        if (userId !== user.id) {
          setTypingUsers(prev => {
            if (isTyping) {
              return prev.includes(userId) ? prev : [...prev, userId];
            } else {
              return prev.filter(id => id !== userId);
            }
          });
        }
      })
      .subscribe();

    // Subscribe to message status updates
    let messageChannel: any = null;
    if (messageId) {
      messageChannel = supabase.channel(`message:${messageId}:status`)
        .on('broadcast', { event: 'status_update' }, ({ payload }) => {
          setMessageStatus(payload);
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, [conversationId, messageId, user]);

  const sendTypingIndicator = (isTyping: boolean) => {
    supabase.channel(`conversation:${conversationId}:typing`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping }
      });
  };

  const updateMessageStatus = (status: 'delivered' | 'read') => {
    if (!messageId) return;
    
    const payload = {
      messageId,
      delivered: true,
      read: status === 'read',
      readAt: status === 'read' ? new Date().toISOString() : undefined
    };
    
    setMessageStatus(payload);
    
    supabase.channel(`message:${messageId}:status`)
      .send({
        type: 'broadcast',
        event: 'status_update',
        payload
      });
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {/* Online Status Indicators */}
      {showOnlineStatus && onlineUsers.map(user => (
        <div key={user.userId} className="flex items-center gap-1">
          <Circle 
            className={`h-2 w-2 ${user.isOnline ? "fill-green-500 text-green-500" : "fill-gray-300 text-gray-300"}`} 
          />
          {!user.isOnline && (
            <span className="text-xs">{formatLastSeen(user.lastSeen)}</span>
          )}
        </div>
      ))}
      
      {/* Typing Indicators */}
      {showTypingIndicator && typingUsers.length > 0 && (
        <div className="flex items-center gap-1 text-blue-500">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs">typing...</span>
        </div>
      )}
      
      {/* Message Delivery Status */}
      {showDeliveryStatus && messageStatus && (
        <div className="flex items-center gap-1">
          {messageStatus.read ? (
            <CheckCheck className="h-3 w-3 text-blue-500" />
          ) : messageStatus.delivered ? (
            <Check className="h-3 w-3 text-gray-400" />
          ) : (
            <Circle className="h-2 w-2 fill-gray-300 text-gray-300" />
          )}
        </div>
      )}
    </div>
  );
};

export { RealtimeIndicators };
export type { OnlineUser, MessageStatus };