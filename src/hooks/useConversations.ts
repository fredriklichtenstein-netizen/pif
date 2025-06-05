
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@/types/messaging";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useGlobalAuth();

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel>;
    
    const fetchConversations = async () => {
      // Don't attempt to fetch if auth is still loading or user is not authenticated
      if (authLoading || !user) {
        if (!authLoading && !user) {
          setError(new Error("You must be signed in to view conversations"));
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log("Fetching conversations for user:", user.id);
        setIsLoading(true);
        setError(null);

        // Use the security definer function to get conversation IDs
        const { data: conversationIds, error: funcError } = await supabase
          .rpc('get_user_conversation_ids');
          
        if (funcError) throw funcError;
        
        if (!conversationIds || conversationIds.length === 0) {
          console.log("No conversations found");
          if (mounted) {
            setConversations([]);
            setIsLoading(false);
          }
          return;
        }

        console.log(`Found ${conversationIds.length} conversations`);

        // Fetch conversations data
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            item:items(id, title, images)
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Fetch participants separately to avoid nesting issues
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            *,
            profile:profiles(id, username, avatar_url)
          `)
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;

        // Combine the data
        if (conversationsData && mounted) {
          // Group participants by conversation
          const participantsByConversation = participantsData?.reduce((acc, participant) => {
            if (!acc[participant.conversation_id]) {
              acc[participant.conversation_id] = [];
            }
            acc[participant.conversation_id].push(participant);
            return acc;
          }, {} as Record<string, typeof participantsData>);

          // Transform to match our Conversation type
          const transformedConversations = conversationsData.map(conv => {
            return {
              id: conv.id,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              item_id: conv.item_id,
              last_message_text: conv.last_message_text,
              participants: participantsByConversation[conv.id] || [],
              item: conv.item ? {
                id: String(conv.item.id),
                title: conv.item.title,
                description: "",
                category: "",
                condition: "",
                measurements: {},
                images: conv.item.images || [],
                location: "",
                coordinates: null,
                postedBy: {
                  id: "",
                  name: "User",
                  avatar: ""
                },
                createdAt: "",
                status: "",
                likesCount: 0,
                interestsCount: 0,
                commentsCount: 0
              } : undefined
            };
          });
          
          setConversations(transformedConversations);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        if (mounted) {
          setError(err as Error);
          toast({
            variant: "destructive",
            title: "Failed to load conversations",
            description: (err as Error).message,
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConversations();

    // Only set up real-time subscription if user is authenticated
    if (user) {
      // Set up real-time subscription
      channel = supabase
        .channel('public:conversations')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'conversations' 
          }, 
          () => {
            console.log("Received real-time update for conversations");
            // Refresh conversations when changes occur
            fetchConversations();
        })
        .subscribe();
    }

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast, user, authLoading]);

  return { conversations, isLoading, error };
}
