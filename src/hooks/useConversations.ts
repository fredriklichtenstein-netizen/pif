
import { useState, useEffect, useRef } from "react";
import { isSafeMode } from "@/utils/safeMode";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@/types/messaging";
import { useAuthReady } from "@/hooks/auth/useAuthReady";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_CONVERSATIONS } from "@/data/mockConversations";
import { useTranslation } from "react-i18next";
import { debugLog } from "@/utils/authDebug";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);
  const fetchRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();
  const { user, isReady } = useAuthReady();
  const authLoading = !isReady;
  const { t } = useTranslation();

  // Internal safety: only start the 5s skeleton-cap once auth has finished
  // its first restore attempt. Starting it on mount would race hard refresh
  // and flip empty UI before the session hydrates.
  useEffect(() => {
    if (!isReady) return;
    const safety = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(safety);
  }, [isReady]);

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
      debugLog("conversations", "fetchConversations called", { isReady, hasUser: !!user?.id });
      if (authLoading || !user) {
        if (!authLoading && !user) {
          debugLog("conversations", "fetch: ready but no user → must-sign-in error");
          setError(new Error(t('interactions.must_sign_in_conversations')));
          setIsLoading(false);
        } else {
          debugLog("conversations", "fetch skipped: auth not ready");
        }
        return;
      }

      try {
        if (!hasLoadedRef.current) setIsLoading(true);
        setError(null);

        debugLog("conversations", "querying get_user_conversation_ids RPC");
        const { data: conversationIds, error: funcError } = await supabase.rpc('get_user_conversation_ids');
        if (funcError) throw funcError;
        debugLog("conversations", "RPC returned", { count: conversationIds?.length ?? 0 });

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
          .select('conversation_id, content, created_at, sender_id, deleted_at, is_system_message, target_user_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        // Preview: most recent message regardless of system/user origin.
        // "Inga meddelanden än" should only appear when zero messages exist.
        const lastByConv = new Map<string, string>();
        for (const m of (recentMessages || []) as any[]) {
          const cid = String(m.conversation_id);
          if (lastByConv.has(cid)) continue;
          if (typeof m.content === 'string' && m.content.trim()) {
            lastByConv.set(cid, m.content);
          }
        }

        if (conversationsData && mounted) {
          const participantsByConversation = participantsData?.reduce((acc, participant) => {
            if (!acc[participant.conversation_id]) acc[participant.conversation_id] = [];
            acc[participant.conversation_id].push(participant);
            return acc;
          }, {} as Record<string, typeof participantsData>);

          // Per-conversation unread counts are owned by useUnreadMessagesCount
          // (single source of truth, fresh DB last_read_at). We no longer
          // compute unread here to avoid divergence from the nav badge.

          const transformedConversations = conversationsData.map(conv => {
            const participants = (participantsByConversation[conv.id] || []).map((p: any) => ({ ...p, id: String(p.id) }));
            const latest = lastByConv.get(String(conv.id));
            const itemAny = conv.item as any;
            return {
              id: conv.id, created_at: conv.created_at, updated_at: conv.updated_at,
              item_id: conv.item_id,
              last_message_text: latest ?? conv.last_message_text,
              participants,
              item: itemAny ? {
                id: String(itemAny.id), title: itemAny.title, description: "", category: "",
                condition: "", measurements: {}, images: itemAny.images || [], location: "",
                coordinates: null, postedBy: { id: "", name: "", avatar: "" },
                createdAt: "", status: itemAny.pif_status || "",
                likesCount: 0, interestsCount: 0, commentsCount: 0
              } : undefined
            };
          });
          console.debug('[useConversations] setConversations', {
            idsFromRpc: conversationIds,
            idsFromSelect: conversationsData?.map((c: any) => c.id),
            finalIds: transformedConversations.map((c: any) => ({
              id: c.id,
              item_id: c.item_id,
              item_status: c.item?.status ?? null,
            })),
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

    fetchRef.current = fetchConversations;
    fetchConversations();

    if (user && !isSafeMode()) {
      channel = supabase.channel(`public:conversations:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          fetchConversations();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new as any;
          if (m && typeof m.content === 'string' && m.content.trim()) {
            const cid = String(m.conversation_id);
            const content = m.content as string;
            const createdAt = m.created_at as string;
            setConversations((current) =>
              current.map((c) =>
                String(c.id) === cid
                  ? { ...c, last_message_text: content, updated_at: createdAt || c.updated_at }
                  : c,
              ),
            );
          }
          fetchConversations();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
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
      // Also opportunistically refetch: if the conversation that was
      // just marked read isn't yet in our list (e.g. a just-created
      // wish conversation reached via notification deep-link before
      // Realtime delivered the participant insert), this is exactly
      // the moment to reconcile it in.
      fetchRef.current?.();
    };
    window.addEventListener('pif:conversation-read', onConversationRead);

    // When a pif's status transitions to a terminal state (completed /
    // archived), immediately re-categorize the matching conversation
    // from Aktiva → Historik without waiting on a refetch. The status
    // event is dispatched by usePifCompletion on Realtime updates.
    const onPifStatusChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId?: string | number; pifStatus?: string }>).detail;
      if (!detail?.itemId || !detail.pifStatus) return;
      const targetId = String(detail.itemId);
      setConversations((current) =>
        current.map((conversation) => {
          if (String(conversation.item_id ?? '') !== targetId) return conversation;
          return {
            ...conversation,
            item: conversation.item
              ? { ...conversation.item, status: detail.pifStatus! }
              : conversation.item,
          };
        }),
      );
    };
    window.addEventListener('pif:status-changed', onPifStatusChanged);

    // Conservative refetch on focus/visibility — recovers from missed
    // Realtime events (e.g. a wish conversation created seconds before
    // /messages mounted, racing the participants insert).
    const onFocus = () => fetchRef.current?.();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchRef.current?.();
    };
    const onManualRefresh = () => fetchRef.current?.();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pif:conversations-refresh', onManualRefresh);

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('pif:conversation-read', onConversationRead);
      window.removeEventListener('pif:status-changed', onPifStatusChanged);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pif:conversations-refresh', onManualRefresh);
      fetchRef.current = null;
    };
  }, [toast, user, authLoading, t]);


  const refreshConversations = () => {
    fetchRef.current?.();
  };

  return { conversations, isLoading, error, refreshConversations };
}
