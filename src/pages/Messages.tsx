
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
import { MainNav } from "@/components/MainNav";
import { useTranslation } from "react-i18next";

const Messages = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { conversations, isLoading: conversationsLoading, error } = useConversations();
  const { unreadCount } = useNotifications();
  const { t } = useTranslation();

  const isLoading = authLoading || conversationsLoading;

  useEffect(() => {
    if (!authLoading && !user) {
    }
  }, [authLoading, user]);

  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");

  const handleTabChange = (value: string) => {
    if (value === "messages" || value === "notifications") {
      setActiveTab(value);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 pb-20 pt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full flex justify-center border rounded-lg bg-background">
            <TabsTrigger value="messages" className="flex items-center gap-2 border-r border-border last:border-0">
              <MessageSquare className="h-5 w-5" />
              {t('nav.messages')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
              <Bell className="h-5 w-5" />
              {t('nav.notifications')}
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5 min-w-[20px] text-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="border rounded-lg bg-background">
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
              <div className="text-center my-8 p-6 border border-destructive/30 rounded-lg bg-destructive/5">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-2" />
                <p className="text-destructive font-medium">{t('messages.failed_load_conversations')}</p>
                <p className="text-sm text-destructive/70 mt-2">{error.message}</p>
                <p className="text-sm text-muted-foreground mt-4">{t('messages.try_refreshing')}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 border rounded-lg">
                <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('messages.no_conversations_title')}</h2>
                <p className="text-sm text-muted-foreground">{t('messages.no_conversations_description')}</p>
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
                <div className="md:col-span-2 border rounded-lg overflow-hidden">
                  {activeConversationId ? (
                    <ConversationView conversationId={activeConversationId} />
                  ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <p>{t('messages.no_messages_yet')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationList />
          </TabsContent>
        </Tabs>
      </div>
      <MainNav />
      <Toaster />
    </>
  );
};

export default Messages;
