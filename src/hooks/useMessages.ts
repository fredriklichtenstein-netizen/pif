
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/types/messaging";

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Using a database function to safely check permissions
        const { data: isParticipant, error: accessError } = await supabase
          .rpc('is_conversation_participant', { conversation_id: conversationId });
          
        if (accessError) throw accessError;
        
        if (!isParticipant) {
          throw new Error("You don't have access to this conversation");
        }

        // Fetch messages once access is confirmed
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(data || []);

        // Mark messages as read after retrieving them
        markMessagesAsRead();
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err as Error);
        toast({
          variant: "destructive",
          title: "Failed to load messages",
          description: (err as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`public:messages:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          // Add new message to state
          const newMessage = payload.new as Message;
          setMessages(currentMessages => [...currentMessages, newMessage]);
          
          // Mark the new message as read if it's not from current user
          markMessageAsRead(newMessage.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, toast]);

  // Function to mark a single message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) return;

      // Only mark as read if the current user didn't send it
      const message = messages.find(m => m.id === messageId);
      if (message && message.sender_id !== userId && !message.read_at) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', messageId);
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Function to mark all unread messages in the conversation as read
  const markMessagesAsRead = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) return;

      // Update participant record to indicate the user has read the conversation
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      // Mark all unread messages from others as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) {
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      if (!userId) {
        throw new Error("You must be signed in to send messages");
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: (err as Error).message,
      });
      throw err;
    }
  };

  return { messages, isLoading, error, sendMessage, markMessagesAsRead };
}
