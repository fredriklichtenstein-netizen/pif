
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

        const { data, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        setMessages(data || []);
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, toast]);

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

  return { messages, isLoading, error, sendMessage };
}
