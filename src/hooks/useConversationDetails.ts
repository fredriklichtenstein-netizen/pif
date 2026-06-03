
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Conversation, ConversationParticipant } from "@/types/messaging";
import type { Post } from "@/types/post";
import { parseCoordinatesFromDB } from "@/types/post";

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

    const fetchConversationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the conversation row + item. Participants are fetched
        // separately via a SECURITY DEFINER RPC because RLS on
        // conversation_participants restricts direct SELECT to the caller's
        // own row, hiding the "other" participant in 1:1 conversations.
        const { data, error: conversationError } = await supabase
          .from('conversations')
          .select(`*, item:items(*)`)
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
              location: data.item.location || "",
              coordinates: (() => {
                if (!data.item.coordinates) return null;
                try {
                  return typeof data.item.coordinates === 'string' ? 
                    parseCoordinatesFromDB(data.item.coordinates) : 
                    (data.item.coordinates && typeof data.item.coordinates === 'object' && 'lat' in data.item.coordinates && 'lng' in data.item.coordinates) ?
                    data.item.coordinates as { lat: number; lng: number } : null;
                } catch {
                  return null;
                }
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
              location: data.item.location || "",
              coordinates: (() => {
                if (!data.item.coordinates) return null;
                try {
                  return typeof data.item.coordinates === 'string' ? 
                    parseCoordinatesFromDB(data.item.coordinates) : 
                    (data.item.coordinates && typeof data.item.coordinates === 'object' && 'lat' in data.item.coordinates && 'lng' in data.item.coordinates) ?
                    data.item.coordinates as { lat: number; lng: number } : null;
                } catch {
                  return null;
                }
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
        setIsLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId, currentUserId, toast]);

  return { conversation, otherParticipant, item, isLoading, error };
}
