
import { useState, useEffect } from "react";
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
        setIsLoading(true);
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

        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants').select(`*, profile:profiles(id, username, avatar_url, first_name, last_name)`)
          .in('conversation_id', conversationIds);
        if (participantsError) throw participantsError;

        // Fetch the latest message per conversation as authoritative preview
        // (last_message_text on conversations is not always kept in sync).
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        const lastByConv = new Map<string, string>();
        for (const m of (recentMessages || []) as any[]) {
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
                createdAt: "", status: itemAny.pif_status || itemAny.status || "",
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
      } finally { if (mounted) setIsLoading(false); }
    };

    fetchConversations();

    if (user) {
      channel = supabase.channel('public:conversations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          fetchConversations();
        }).subscribe();
    }

    return () => { mounted = false; if (channel) supabase.removeChannel(channel); };
  }, [toast, user, authLoading, t]);

  return { conversations, isLoading, error };
}
