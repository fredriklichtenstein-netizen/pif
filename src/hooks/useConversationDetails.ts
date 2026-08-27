
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Conversation, ConversationParticipant } from "@/types/messaging";
import type { Post } from "@/types/post";
import { parseCoordinatesFromDB } from "@/types/post";
import { ITEM_PUBLIC_COLUMNS } from "@/services/items/publicColumns";

export function useConversationDetails(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<ConversationParticipant | null>(null);
  const [item, setItem] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const currentUserId = user?.id;

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    // `silent` skips the isLoading flip for background refetches -- a
    // message insert bumps the conversation row (trg_bump_conversation_on_message),
    // which fires the postgres_changes subscription below on EVERY message
    // sent. Flipping isLoading there flashed the whole ConversationView to
    // its skeleton UI and back on every single message -- reported live as
    // "refreshes the conversation thread every time I send a message."
    // Only the very first, real load should show the skeleton.
    const fetchConversationDetails = async (opts: { silent?: boolean } = {}) => {
      try {
        if (!opts.silent) setIsLoading(true);
        setError(null);

        // Fetch the conversation row + item. Participants are fetched
        // separately via a SECURITY DEFINER RPC because RLS on
        // conversation_participants restricts direct SELECT to the caller's
        // own row, hiding the "other" participant in 1:1 conversations.
        // item:items(...) must name public columns explicitly — an embed of
        // items(*) would request owner-only columns the database refuses.
        const { data, error: conversationError } = await supabase
          .from('conversations')
          .select(`*, item:items(${ITEM_PUBLIC_COLUMNS})`)
          .eq('id', conversationId)
          .single();

        if (conversationError) throw conversationError;

        // Step 1: participants for this conversation (RPC, with fallback).
        let participantsRaw: any[] = [];
        const rpcRes = await (supabase.rpc as any)('get_conversation_participants', {
          p_conversation_ids: [conversationId],
        });
        if (!rpcRes.error && Array.isArray(rpcRes.data)) {
          participantsRaw = rpcRes.data;
        } else {
          const { data: directData } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId);
          participantsRaw = directData || [];
        }

        // Step 2: profiles for all participant user_ids from public.profiles.
        const ids = Array.from(
          new Set(participantsRaw.map((p: any) => p.user_id).filter(Boolean))
        );
        const profilesById = new Map<string, any>();
        if (ids.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, first_name, last_name')
            .in('id', ids);
          if (profilesError) {
            console.error('Failed to fetch participant profiles:', profilesError);
          }
          for (const pr of (profilesData || []) as any[]) {
            profilesById.set(String(pr.id), pr);
          }
        }
        const participantsWithProfiles = participantsRaw.map((p: any) => ({
          ...p,
          profile: profilesById.get(String(p.user_id)) || null,
        }));
        if (data) {
          (data as any).participants = participantsWithProfiles;
        }


        // Transform the data to match our Conversation type
        if (data) {
          const transformedConversation: Conversation = {
            id: data.id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            item_id: data.item_id,
            last_message_text: data.last_message_text,
            closed_at: (data as any).closed_at ?? null,
            reopen_requested_by: (data as any).reopen_requested_by ?? null,
            reopen_requested_at: (data as any).reopen_requested_at ?? null,
            reopen_request_comment: (data as any).reopen_request_comment ?? null,
            reopened_at: (data as any).reopened_at ?? null,
            participants: (data.participants || []).map((p: any) => ({ ...p, id: String(p.id) })),
            item: data.item ? {
              id: String(data.item.id),
              title: data.item.title,
              description: data.item.description || "",
              category: data.item.category || "",
              condition: data.item.condition || "",
              measurements: data.item.measurements ? 
                (typeof data.item.measurements === 'object' ? 
                  Object.entries(data.item.measurements).reduce((acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                  }, {} as {[key: string]: string}) : 
                  {}
                ) : {},
              images: data.item.images || [],
              location: (data.item as any).location_public || "",
              coordinates: (() => {
                // Coarse point only. A selected receiver who needs the exact
                // pickup location gets it from fetchItemPrivateLocation(), which
                // the database authorises per-user; it is never carried on the
                // conversation payload.
                const cj: any = (data.item as any).coordinates_public;
                if (cj && typeof cj === 'object' && 'lat' in cj && 'lng' in cj) {
                  return { lat: Number(cj.lat), lng: Number(cj.lng) };
                }
                return null;
              })(),
              postedBy: {
                id: data.item.user_id,
                name: "User",
                avatar: ""
              },
              createdAt: data.item.created_at,
              status: data.item.pif_status || "",
              likesCount: 0,
              interestsCount: 0,
              commentsCount: 0
            } : undefined
          };
          
          setConversation(transformedConversation);
          
          // Find the other participant (not the current user)
          if (data.participants) {
            const other = data.participants.find(
              (p: any) => p.user_id !== currentUserId
            ) || null;
            
            setOtherParticipant(other ? { ...other, id: String(other.id) } as ConversationParticipant : null);
          }
          
          // Set item details (transformed to match Post type)
          if (data.item) {
            const transformedItem: Post = {
              id: String(data.item.id),
              title: data.item.title,
              description: data.item.description || "",
              category: data.item.category || "",
              condition: data.item.condition || "",
              measurements: data.item.measurements ? 
                (typeof data.item.measurements === 'object' ? 
                  Object.entries(data.item.measurements).reduce((acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                  }, {} as {[key: string]: string}) : 
                  {}
                ) : {},
              images: data.item.images || [],
              location: (data.item as any).location_public || "",
              coordinates: (() => {
                // Coarse point only. A selected receiver who needs the exact
                // pickup location gets it from fetchItemPrivateLocation(), which
                // the database authorises per-user; it is never carried on the
                // conversation payload.
                const cj: any = (data.item as any).coordinates_public;
                if (cj && typeof cj === 'object' && 'lat' in cj && 'lng' in cj) {
                  return { lat: Number(cj.lat), lng: Number(cj.lng) };
                }
                return null;
              })(),
              postedBy: {
                id: data.item.user_id,
                name: "User",
                avatar: ""
              },
              createdAt: data.item.created_at,
              status: data.item.pif_status || "",
              likesCount: 0,
              interestsCount: 0,
              commentsCount: 0
            };
            
            setItem(transformedItem);
          }
        }
      } catch (err) {
        console.error('Error fetching conversation details:', err);
        setError(err as Error);
        toast({
          variant: "destructive",
          title: t('interactions.failed_load_conversation_details'),
          description: (err as Error).message,
        });
      } finally {
        if (!opts.silent) setIsLoading(false);
      }
    };

    fetchConversationDetails();

    // Allow external actions (e.g. usePifCompletion.withdraw/requestReopen)
    // to request a refetch so freshly-changed fields like closed_at or the
    // reopen_* columns land in the UI without a full page reload. Silent --
    // the user just took an action and already sees its direct feedback
    // (dialog closing, toast), a skeleton flash on top of that is noise.
    const onRefetch = (event: Event) => {
      const detail = (event as CustomEvent<{ conversationId?: string }>).detail;
      if (!detail?.conversationId || detail.conversationId === conversationId) {
        fetchConversationDetails({ silent: true });
      }
    };
    window.addEventListener('pif:conversation-refetch', onRefetch);

    // Live updates for the OTHER participant: a reopen request/response is
    // made from their client, not ours, so the custom event above never
    // fires here -- only a real postgres_changes subscription reflects it
    // without requiring a manual refresh. Silent -- this also fires on
    // every message sent (trg_bump_conversation_on_message bumps the
    // conversation row on each insert), so a loud refetch here flashed the
    // whole view to its skeleton on every message.
    const channel = supabase
      .channel(`conversation-reopen:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
        () => fetchConversationDetails({ silent: true }),
      )
      .subscribe();

    return () => {
      window.removeEventListener('pif:conversation-refetch', onRefetch);
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, toast]);

  return { conversation, otherParticipant, item, isLoading, error };
}
