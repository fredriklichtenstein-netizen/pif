
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation } from "@/types/messaging";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const session = await supabase.auth.getSession();
        if (!session.data.session?.user) {
          setConversations([]);
          setIsLoading(false);
          return;
        }

        const userId = session.data.session.user.id;
        
        // Use the security definer function to get conversation IDs
        const { data: conversationIds, error: funcError } = await supabase
          .rpc('get_user_conversation_ids');
          
        if (funcError) throw funcError;
        
        if (!conversationIds || conversationIds.length === 0) {
          setConversations([]);
          setIsLoading(false);
          return;
        }

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
        if (conversationsData) {
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
                description: "",  // Default value
                category: "",     // Default value
                condition: "",    // Default value
                measurements: {}, // Default value
                images: conv.item.images || [],
                location: "",     // Default value
                coordinates: null,
                postedBy: {
                  id: "",         // Will be populated if needed
                  name: "User",   // Default value
                  avatar: ""      // Default value
                },
                createdAt: "",    // Default value
                status: ""        // Default value
              } : undefined
            };
          });
          
          setConversations(transformedConversations);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err as Error);
        toast({
          variant: "destructive",
          title: "Failed to load conversations",
          description: (err as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations' 
        }, 
        () => {
          // Refresh conversations when changes occur
          fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { conversations, isLoading, error };
}
