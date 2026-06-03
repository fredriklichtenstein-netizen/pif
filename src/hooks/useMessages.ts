
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Message } from "@/types/messaging";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_MESSAGES } from "@/data/mockConversations";
import { DEMO_USER } from "@/data/mockUser";

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  // Guard so mark_conversation_read is only called ONCE per conversationId
  // for the lifetime of this hook instance. Without this, re-renders or
  // realtime updates can re-trigger the RPC and loop.
  const markedReadForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    // Demo mode: return mock messages
    if (DEMO_MODE) {
      const timer = setTimeout(() => {
        const mockMessages = MOCK_MESSAGES[conversationId] || [];
        setMessages(mockMessages as Message[]);
        setIsLoading(false);
      }, 200);

      return () => clearTimeout(timer);
    }

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Using a database function to safely check permissions
        const { data: isParticipant, error: accessError } = await supabase
          .rpc('is_conversation_participant', { p_conversation_id: conversationId });

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

        setMessages((data || []).map((m: any) => ({ ...m, id: String(m.id) })));

        // Mark messages as read ONCE per conversation open.
        if (markedReadForRef.current !== conversationId) {
          markedReadForRef.current = conversationId;
          markConversationRead();
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err as Error);
        toast({
          variant: "destructive",
          title: t('interactions.messages_load_failed'),
          description: (err as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Realtime: handle inserts AND updates (soft-deletes, read receipts).
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
          const newMessage = { ...(payload.new as any), id: String((payload.new as any).id) } as Message;
          setMessages(currentMessages => {
            if (currentMessages.some(m => m.id === newMessage.id)) return currentMessages;
            return [...currentMessages, newMessage];
          });
          markConversationRead();
        })
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updated = { ...(payload.new as any), id: String((payload.new as any).id) } as Message;
          setMessages(curr => curr.map(m => (m.id === updated.id ? { ...m, ...updated } : m)));
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, toast]);

  // Mark the whole conversation as read for the current user.
  // Uses the server RPC so RLS / timestamps are handled in one place.
  const markConversationRead = useCallback(async () => {
    if (DEMO_MODE || !conversationId) return;
    try {
      console.log('[messages] mark_conversation_read →', conversationId);
      const { error: rpcError } = await (supabase.rpc as any)('mark_conversation_read', {
        p_conversation_id: conversationId,
      });
      if (rpcError) {
        console.warn('[messages] mark_conversation_read RPC failed, falling back:', rpcError);
        // Fallback to direct update if RPC is unavailable.
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) return;
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId)
          .is('read_at', null);
      }
      // Notify any unread-count listeners (nav badge, tab counter)
      // so the badge drops to zero immediately without waiting for realtime.
      window.dispatchEvent(
        new CustomEvent('pif:conversation-read', { detail: { conversationId } }),
      );
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [conversationId]);


  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) {
      return;
    }

    if (DEMO_MODE) {
      const newMessage: Message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: DEMO_USER.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setMessages(currentMessages => [...currentMessages, newMessage]);
      return newMessage;
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
        title: t('interactions.message_send_failed'),
        description: (err as Error).message,
      });
      throw err;
    }
  };

  const deleteMessage = useCallback(async (messageId: string) => {
    if (DEMO_MODE) {
      setMessages(curr =>
        curr.map(m =>
          m.id === messageId
            ? { ...m, deleted_at: new Date().toISOString(), content: "" }
            : m,
        ),
      );
      return;
    }
    try {
      // Optimistic local update so the placeholder shows immediately.
      setMessages(curr =>
        curr.map(m =>
          m.id === messageId
            ? { ...m, deleted_at: new Date().toISOString(), content: "" }
            : m,
        ),
      );
      const { error: rpcError } = await (supabase.rpc as any)('delete_own_message', {
        p_message_id: Number(messageId),
      });
      if (rpcError) throw rpcError;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        variant: "destructive",
        title: t('messages.delete_message_failed', { defaultValue: 'Kunde inte ta bort meddelandet' }),
        description: (err as Error).message,
      });
    }
  }, [toast, t]);

  return { messages, isLoading, error, sendMessage, deleteMessage, markMessagesAsRead: markConversationRead };
}
