
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@/types/messaging";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_CONVERSATIONS } from "@/data/mockConversations";
import { useTranslation } from "react-i18next";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useGlobalAuth();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel>;
    
    if (DEMO_MODE) {
      const timer = setTimeout(() => {
        if (mounted) { setConversations(MOCK_CONVERSATIONS); setIsLoading(false); }
      }, 300);
      return () => { mounted = false; clearTimeout(timer); };
    }
    
    const fetchConversations = async () => {
      if (authLoading || !user) {
        if (!authLoading && !user) {
          setError(new Error(t('interactions.must_sign_in_conversations')));
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!hasLoadedRef.current) setIsLoading(true);
        setError(null);

        const { data: conversationIds, error: funcError } = await supabase.rpc('get_user_conversation_ids');
        if (funcError) throw funcError;
        
        if (!conversationIds || conversationIds.length === 0) {
          if (mounted) { setConversations([]); setIsLoading(false); }
          return;
        }
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations').select(`*, item:items(id, title, images, pif_status)`)
          .in('id', conversationIds).order('updated_at', { ascending: false });
        if (conversationsError) throw conversationsError;

        // Step 1: fetch ALL participants for these conversations.
        // RLS on conversation_participants restricts direct SELECT to the
        // caller's own rows, so we use a SECURITY DEFINER RPC that returns
        // every participant in conversations the caller is a member of.
        // Fall back to direct select if the RPC is unavailable.
        let participantsRaw: any[] | null = null;
        const rpcRes = await (supabase.rpc as any)('get_conversation_participants', {
          p_conversation_ids: conversationIds,
        });
        if (!rpcRes.error && Array.isArray(rpcRes.data)) {
          participantsRaw = rpcRes.data;
        } else {
          const { data: directData, error: directErr } = await supabase
            .from('conversation_participants').select(`*`)
            .in('conversation_id', conversationIds);
          if (directErr) throw directErr;
          participantsRaw = directData || [];
        }

        // Step 2: fetch profiles separately from public.profiles.
        // (conversation_participants.user_id FKs to auth.users, so PostgREST
        // embedding through that relation silently returns null.)
        const userIds = Array.from(
          new Set((participantsRaw || []).map((p: any) => p.user_id).filter(Boolean))
        );
        const profilesById = new Map<string, any>();
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, first_name, last_name')
            .in('id', userIds);
          if (profilesError) {
            console.error('Failed to fetch participant profiles:', profilesError);
          }
          for (const pr of (profilesData || []) as any[]) {
            profilesById.set(String(pr.id), pr);
          }
        }
        const participantsData = (participantsRaw || []).map((p: any) => ({
          ...p,
          profile: profilesById.get(String(p.user_id)) || null,
        }));


        // Fetch the latest message per conversation as authoritative preview
        // (last_message_text on conversations is not always kept in sync).
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at, sender_id, deleted_at, is_system_message')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        const lastByConv = new Map<string, string>();
        for (const m of (recentMessages || []) as any[]) {
          if (m.is_system_message) continue;
          const cid = String(m.conversation_id);
          if (!lastByConv.has(cid) && typeof m.content === 'string' && m.content.trim()) {
            lastByConv.set(cid, m.content);
          }
        }

        if (conversationsData && mounted) {
          const participantsByConversation = participantsData?.reduce((acc, participant) => {
            if (!acc[participant.conversation_id]) acc[participant.conversation_id] = [];
            acc[participant.conversation_id].push(participant);
            return acc;
          }, {} as Record<string, typeof participantsData>);

          // Per-conversation unread count: messages from the other user
          // created strictly after the current user's last_read_at.
          const unreadByConv = new Map<string, number>();
          const currentUserId = user.id;
          for (const m of (recentMessages || []) as any[]) {
            if (m.is_system_message) continue;
            const cid = String(m.conversation_id);
            if (m.sender_id === currentUserId) continue;
            const myParticipant = (participantsByConversation[cid] || []).find(
              (p: any) => p.user_id === currentUserId,
            );
            const lastRead = myParticipant?.last_read_at
              ? new Date(myParticipant.last_read_at).getTime()
              : 0;
            const created = new Date(m.created_at).getTime();
            if (created > lastRead) {
              unreadByConv.set(cid, (unreadByConv.get(cid) ?? 0) + 1);
            }
          }

          const transformedConversations = conversationsData.map(conv => {
            const participants = (participantsByConversation[conv.id] || []).map((p: any) => ({ ...p, id: String(p.id) }));
            const latest = lastByConv.get(String(conv.id));
            const itemAny = conv.item as any;
            return {
              id: conv.id, created_at: conv.created_at, updated_at: conv.updated_at,
              item_id: conv.item_id,
              last_message_text: latest ?? conv.last_message_text,
              participants,
              unread_count: unreadByConv.get(String(conv.id)) ?? 0,
              item: itemAny ? {
                id: String(itemAny.id), title: itemAny.title, description: "", category: "",
                condition: "", measurements: {}, images: itemAny.images || [], location: "",
                coordinates: null, postedBy: { id: "", name: "", avatar: "" },
                createdAt: "", status: itemAny.pif_status || "",
                likesCount: 0, interestsCount: 0, commentsCount: 0
              } : undefined
            };
          });
          setConversations(transformedConversations as Conversation[]);
        }

      } catch (err) {
        console.error('Error fetching conversations:', err);
        if (mounted) {
          setError(err as Error);
          toast({ variant: "destructive", title: t('interactions.failed_load_conversations'), description: (err as Error).message });
        }
      } finally {
        if (mounted) {
          hasLoadedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    fetchConversations();

    if (user) {
      channel = supabase.channel(`public:conversations:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          fetchConversations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchConversations();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, () => {
          fetchConversations();
        }).subscribe();
    }

    const onConversationRead = (event: Event) => {
      const conversationId = (event as CustomEvent<{ conversationId?: string }>).detail?.conversationId;
      if (conversationId) {
        setConversations((current) =>
          current.map((conversation) =>
            String(conversation.id) === String(conversationId)
              ? { ...conversation, unread_count: 0 }
              : conversation,
          ),
        );
      }
    };
    window.addEventListener('pif:conversation-read', onConversationRead);

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('pif:conversation-read', onConversationRead);
    };
  }, [toast, user, authLoading, t]);


  return { conversations, isLoading, error };
}
