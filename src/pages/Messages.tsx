
import { useState, useEffect } from "react";
import { useConversations } from "@/hooks/useConversations";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationView } from "@/components/messaging/ConversationView";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Skeleton } from "@/components/ui/skeleton";

const Messages = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { conversations, isLoading: conversationsLoading, error } = useConversations();
  
  const isLoading = authLoading || conversationsLoading;

  // Wait for auth to be ready before attempting to load conversations
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("No authenticated user in Messages page");
    }
  }, [authLoading, user]);

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 border rounded-lg overflow-hidden">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="md:col-span-2 border rounded-lg overflow-hidden">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center my-8 p-6 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
          <p className="text-red-500 font-medium">Failed to load conversations</p>
          <p className="text-sm text-red-400 mt-2">{error.message}</p>
          <p className="text-sm text-gray-500 mt-4">Please try refreshing the page</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="font-medium">No conversations yet</p>
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
