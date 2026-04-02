
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
          .from('conversations').select(`*, item:items(id, title, images)`)
          .in('id', conversationIds).order('updated_at', { ascending: false });
        if (conversationsError) throw conversationsError;

        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants').select(`*, profile:profiles(id, username, avatar_url)`)
          .in('conversation_id', conversationIds);
        if (participantsError) throw participantsError;

        if (conversationsData && mounted) {
          const participantsByConversation = participantsData?.reduce((acc, participant) => {
            if (!acc[participant.conversation_id]) acc[participant.conversation_id] = [];
            acc[participant.conversation_id].push(participant);
            return acc;
          }, {} as Record<string, typeof participantsData>);

          const transformedConversations = conversationsData.map(conv => {
            const participants = (participantsByConversation[conv.id] || []).map((p: any) => ({ ...p, id: String(p.id) }));
            return {
              id: conv.id, created_at: conv.created_at, updated_at: conv.updated_at,
              item_id: conv.item_id, last_message_text: conv.last_message_text, participants,
              item: conv.item ? {
                id: String(conv.item.id), title: conv.item.title, description: "", category: "",
                condition: "", measurements: {}, images: conv.item.images || [], location: "",
                coordinates: null, postedBy: { id: "", name: "User", avatar: "" },
                createdAt: "", status: "", likesCount: 0, interestsCount: 0, commentsCount: 0
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
