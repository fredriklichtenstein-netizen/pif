
import { useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { MainNav } from "@/components/MainNav";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";

const Messages = () => {
  const { user, isLoading: authLoading } = useGlobalAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { conversations, isLoading: conversationsLoading, error } = useConversations();
  const { unreadCount } = useNotifications();
  const { unreadMessagesCount } = useUnreadMessagesCount();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">(
    () => (searchParams.get("tab") === "notifications" ? "notifications" : "messages")
  );
  const markedAsRead = useRef(new Set<string>());
  // Track which deep-link value we've already consumed so realtime-driven
  // re-renders of the conversations array don't re-apply a stale URL param
  // on top of the user's own click.
  const appliedDeepLinkRef = useRef<string | null>(null);
  // Safety net: if auth or conversations never resolve on cold load, flip
  // to a rendered empty state after 5s rather than spinning forever.
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!authLoading && !conversationsLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const t = setTimeout(() => setLoadingTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [authLoading, conversationsLoading]);

  const isLoading = (authLoading || conversationsLoading) && !loadingTimedOut;


  // Deep-link: open the conversation indicated by ?conversation=<id> or,
  // as a fallback, the conversation tied to ?item=<id>. Applied exactly
  // once per unique URL value, then the param is stripped from the URL so
  // further clicks in the list aren't overwritten.
  useEffect(() => {
    const cid = searchParams.get("conversation");
    const itemId = searchParams.get("item");
    const linkKey = cid ? `c:${cid}` : itemId ? `i:${itemId}` : null;
    if (!linkKey || appliedDeepLinkRef.current === linkKey) return;

    if (cid) {
      appliedDeepLinkRef.current = linkKey;
      setActiveConversationId(cid);
      setActiveTab("messages");
      const next = new URLSearchParams(searchParams);
      next.delete("conversation");
      setSearchParams(next, { replace: true });
      return;
    }
    if (itemId && conversations.length > 0) {
      const match = conversations.find(
        (c) => String(c.item_id ?? "") === String(itemId)
      );
      if (match) {
        appliedDeepLinkRef.current = linkKey;
        setActiveConversationId(match.id);
        setActiveTab("messages");
        const next = new URLSearchParams(searchParams);
        next.delete("item");
        setSearchParams(next, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations]);

  useEffect(() => {
    if (!authLoading && !user) {
    }
  }, [authLoading, user]);

  const handleTabChange = (value: string) => {
    if (value === "messages" || value === "notifications") {
      setActiveTab(value);
      const next = new URLSearchParams(searchParams);
      if (value === "notifications") next.set("tab", "notifications");
      else next.delete("tab");
      setSearchParams(next, { replace: true });
    }
  };

  const markConversationReadOnce = useCallback(async (conversationId: string) => {
    if (DEMO_MODE || !conversationId) return;

    // Dedupe only against concurrent in-flight calls for the SAME
    // conversation, not for the entire session. The previous persistent
    // Set guard meant that once a conversation was opened it could never
    // be re-marked as read again, so new messages arriving while the
    // user was on another tab would leave last_read_at stuck at the
    // first-open timestamp even after re-opening the conversation.
    if (markedAsRead.current.has(conversationId)) {
      console.debug('[messages] mark_conversation_read skipped (in-flight)', conversationId);
      return;
    }
    markedAsRead.current.add(conversationId);

    try {
      console.debug('[messages] mark_conversation_read →', conversationId);
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        'mark_conversation_read',
        { p_conversation_id: conversationId },
      );

      if (rpcError) {
        console.error(
          '[messages] mark_conversation_read RPC failed, falling back:',
          { conversationId, error: rpcError },
        );
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) {
          console.error('[messages] mark_conversation_read fallback aborted: no session');
          return;
        }

        const { error: updErr } = await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        if (updErr) {
          console.error('[messages] fallback participant update failed:', updErr);
        } else {
          console.debug('[messages] fallback participant update OK', { conversationId });
        }

        const { error: msgErr } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId)
          .is('read_at', null);
        if (msgErr) console.error('[messages] fallback messages update failed:', msgErr);
      } else {
        console.debug('[messages] mark_conversation_read OK', { conversationId, rpcData });
      }

      window.dispatchEvent(
        new CustomEvent('pif:conversation-read', { detail: { conversationId } }),
      );
    } catch (err) {
      console.error('[messages] Error marking conversation as read:', { conversationId, err });
    } finally {
      // Release the in-flight lock so future opens (after new messages
      // arrive on the same conversation) can re-mark it as read.
      markedAsRead.current.delete(conversationId);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      void markConversationReadOnce(activeConversationId);
    }
  }, [activeConversationId, markConversationReadOnce]);

  // When new messages arrive while a conversation is open, re-mark it as
  // read so last_read_at advances past those messages too.
  useEffect(() => {
    if (DEMO_MODE || !activeConversationId) return;
    const channel = supabase
      .channel(`messages-read-tracker:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          void markConversationReadOnce(activeConversationId);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, markConversationReadOnce]);

  // Clicking the already-active "Messages" tab collapses the expanded
  // conversation so the overview is fully visible again.
  const handleMessagesTabClick = () => {
    if (activeTab === "messages" && activeConversationId) {
      setActiveConversationId(null);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 pb-20 pt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full flex justify-center border rounded-lg bg-background">
            <TabsTrigger
              value="messages"
              onClick={handleMessagesTabClick}
              className="flex items-center gap-2 border-r border-border last:border-0 relative"
            >
              <MessageSquare className="h-5 w-5" />
              {t('nav.messages')}
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5 min-w-[20px] text-center shadow-lg">
                  {unreadMessagesCount}
                </span>
              )}
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
                <div
                  className={`md:col-span-1 border rounded-lg overflow-hidden md:max-h-[70vh] ${
                    activeConversationId ? 'hidden md:block' : ''
                  }`}
                >
                  <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={(id) => setActiveConversationId(id)}
                  />
                </div>
                <div
                  className={`md:col-span-2 border rounded-lg overflow-hidden flex flex-col h-[70vh] max-h-[70vh] min-h-0 ${
                    activeConversationId ? '' : 'hidden md:flex'
                  }`}
                >
                  {activeConversationId ? (
                    <ConversationView
                      conversationId={activeConversationId}
                      onBack={() => setActiveConversationId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-center flex-1 text-muted-foreground">
                      <p>{t('messages.select_conversation')}</p>
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
