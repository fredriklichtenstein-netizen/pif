
import { useState, useEffect } from "react";
import { useConversations } from "@/hooks/useConversations";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationView } from "@/components/messaging/ConversationView";
import { MessageSquare, Bell, AlertCircle } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";

const Messages = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { conversations, isLoading: conversationsLoading, error } = useConversations();
  const { unreadCount } = useNotifications();

  const isLoading = authLoading || conversationsLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("No authenticated user in Messages page");
    }
  }, [authLoading, user]);

  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");

  const handleTabChange = (value: string) => {
    if (value === "messages" || value === "notifications") {
      setActiveTab(value);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full flex justify-center border rounded-lg bg-white">
          <TabsTrigger value="messages" className="flex items-center gap-2 border-r border-gray-200 last:border-0">
            <MessageSquare className="h-5 w-5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-2 rounded-full bg-primary text-white text-xs px-2 py-0.5 min-w-[20px] text-center shadow-lg">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="border rounded-lg bg-white">
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
            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border rounded-lg">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-400 opacity-50" />
              <h2 className="text-lg font-semibold text-gray-700 mb-2">No conversations yet</h2>
              <p className="text-sm text-gray-500">When you message someone about an item, it will appear here.</p>
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
        </TabsContent>

        <TabsContent value="notifications" className="border rounded-lg bg-white">
          <NotificationList />
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
};

export default Messages;
