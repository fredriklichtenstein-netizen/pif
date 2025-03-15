
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationView } from "@/components/messaging/ConversationView";
import { MessageSquare } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { conversations, isLoading, error } = useConversations();

  useEffect(() => {
    // Redirect to auth page if not authenticated
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 my-8">
          <p>Failed to load conversations: {error.message}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No conversations yet</p>
          <p className="text-sm mt-2">When you message someone about an item, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 border rounded-lg overflow-hidden">
            <ConversationList 
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => setActiveConversationId(id)}
            />
          </div>
          <div className="md:col-span-2 border rounded-lg overflow-hidden h-[calc(100vh-200px)]">
            {activeConversationId ? (
              <ConversationView 
                conversationId={activeConversationId}
              />
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-500">
                <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default Messages;
