
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, ConversationParticipant } from "@/types/messaging";
import type { Post } from "@/types/post";

export function useConversationDetails(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<ConversationParticipant | null>(null);
  const [item, setItem] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    const fetchConversationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch conversation with participants and item details
        const { data, error: conversationError } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              *,
              profile:profiles(id, username, avatar_url, first_name, last_name)
            ),
            item:items(*)
          `)
          .eq('id', conversationId)
          .single();

        if (conversationError) throw conversationError;

        setConversation(data);
        
        // Find the other participant (not the current user)
        if (data?.participants) {
          const other = data.participants.find(
            p => p.user_id !== currentUserId
          ) || null;
          
          setOtherParticipant(other);
        }
        
        // Set item details
        setItem(data?.item || null);
      } catch (err) {
        console.error('Error fetching conversation details:', err);
        setError(err as Error);
        toast({
          variant: "destructive",
          title: "Failed to load conversation details",
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
