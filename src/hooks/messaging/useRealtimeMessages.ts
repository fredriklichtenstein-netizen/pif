
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read_at?: string;
  thread_id?: string;
  mentions?: string[];
  sender?: {
    name: string;
    avatar_url?: string;
  };
}

interface TypingUser {
  user_id: string;
  name: string;
  timestamp: number;
}

export function useRealtimeMessages(conversationId: string) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      try {
        // In a real implementation, this would fetch from Supabase
        // For now, using mock data
        const mockMessages: Message[] = [
          {
            id: '1',
            content: 'Hey, is the camera still available?',
            sender_id: 'user2',
            conversation_id: conversationId,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            sender: { name: 'Emma Andersson' }
          },
          {
            id: '2',
            content: 'Yes! It\'s in great condition. Would you like to meet this weekend?',
            sender_id: session?.user?.id || 'user1',
            conversation_id: conversationId,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            sender: { name: 'You' }
          }
        ];

        setTimeout(() => {
          setMessages(mockMessages);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, session?.user?.id]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!conversationId || !session?.user?.id) return;

    // Messages subscription
    const messageChannel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Typing indicators subscription
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, name, is_typing } = payload.payload;
        
        if (user_id === session.user.id) return; // Ignore own typing
        
        setTypingUsers(prev => {
          if (is_typing) {
            return [
              ...prev.filter(u => u.user_id !== user_id),
              { user_id, name, timestamp: Date.now() }
            ];
          } else {
            return prev.filter(u => u.user_id !== user_id);
          }
        });
      })
      .subscribe();

    // Clean up old typing indicators
    const typingCleanup = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 3000)
      );
    }, 1000);

    return () => {
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();
      clearInterval(typingCleanup);
    };
  }, [conversationId, session?.user?.id]);

  const sendMessage = useCallback(async (content: string, mentions?: string[]) => {
    if (!session?.user?.id || !conversationId) return;

    try {
      // In a real implementation, this would insert into Supabase
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender_id: session.user.id,
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        mentions,
        sender: { name: 'You' }
      };

      // Optimistically add message
      setMessages(prev => [...prev, newMessage]);

      // Here you would actually send to Supabase
      console.log('Sending message:', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [session?.user?.id, conversationId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!session?.user?.id || !conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: session.user.id,
        name: 'You', // In real app, get from profile
        is_typing: isTyping
      }
    });
  }, [session?.user?.id, conversationId]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!session?.user?.id) return;

    try {
      // In a real implementation, this would update the message in Supabase
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [session?.user?.id]);

  return {
    messages,
    typingUsers,
    isConnected,
    loading,
    sendMessage,
    sendTypingIndicator,
    markAsRead
  };
}
