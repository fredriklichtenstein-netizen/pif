
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type NotificationFilter = "all" | "unread";

const FILTER_STORAGE_KEY = "pif.notifications.filter";

function loadStoredFilter(): NotificationFilter {
  if (typeof window === "undefined") return "all";
  const v = window.localStorage.getItem(FILTER_STORAGE_KEY);
  return v === "unread" || v === "all" ? v : "all";
}

export function NotificationList() {
  const { t } = useTranslation();
  const {
    notifications,
    isLoading,
    fetchError,
    markAllAsRead,
    markAsRead,
    unreadCount,
  } = useNotifications();

  const [filter, setFilterState] = useState<NotificationFilter>(loadStoredFilter);
  const setFilter = (next: NotificationFilter) => {
    setFilterState(next);
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); selection still works in-session.
    }
  };

  const visibleNotifications = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, filter]
  );

  const groupedNotifications = useMemo(() => {
    if (!visibleNotifications || visibleNotifications.length === 0) return {};

    return visibleNotifications.reduce((groups, notification) => {
      const type = notification.type.split('_')[0] || 'other';

      if (!groups[type]) {
        groups[type] = [];
      }

      groups[type].push(notification);
      return groups;
    }, {} as Record<string, typeof visibleNotifications>);
  }, [visibleNotifications]);

  const groupDisplayInfo = {
    interest: { name: t('interactions.group_interest'), icon: <AlertCircle className="h-5 w-5 text-blue-500" /> },
    status: { name: t('interactions.group_status'), icon: <Clock className="h-5 w-5 text-green-500" /> },
    comment: { name: t('interactions.group_comment'), icon: <MessageSquare className="h-5 w-5 text-purple-500" /> },
    profile: { name: t('interactions.group_profile'), icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
    other: { name: t('interactions.group_other'), icon: <AlertCircle className="h-5 w-5 text-muted-foreground" /> },
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">{t('interactions.loading_notifications')}</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center text-destructive py-6">
        {fetchError.message}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 border rounded-lg">
        <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{t('interactions.no_notifications')}</h2>
        <p className="text-sm text-muted-foreground">{t('interactions.no_notifications_description')}</p>
      </div>
    );
  }

  const sortedGroupKeys = Object.keys(groupedNotifications).sort((a, b) => {
    const mostRecentA = groupedNotifications[a][0]?.created_at || '';
    const mostRecentB = groupedNotifications[b][0]?.created_at || '';
    return new Date(mostRecentB).getTime() - new Date(mostRecentA).getTime();
  });

  const filterPillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/70"
    }`;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-10">
        <div className="font-medium text-lg">{t('interactions.notifications_title')}</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            {t('interactions.mark_all_read')}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={filterPillClass(filter === "all")}
          aria-pressed={filter === "all"}
        >
          {t('interactions.filter_all', 'All')}
          <span className="ml-1 opacity-70">({notifications.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={filterPillClass(filter === "unread")}
          aria-pressed={filter === "unread"}
        >
          {t('interactions.filter_unread', 'Unread')}
          <span className="ml-1 opacity-70">({unreadCount})</span>
        </button>
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {filter === "unread"
            ? t('interactions.no_unread_notifications', 'No unread notifications.')
            : t('interactions.no_notifications')}
        </div>
      ) : (
      <div className="divide-y">
        {sortedGroupKeys.map(groupKey => {
          const groupNotifications = groupedNotifications[groupKey];
          const { name: groupName, icon } = groupDisplayInfo[groupKey as keyof typeof groupDisplayInfo] || 
                                           groupDisplayInfo.other;
          
          return (
            <div key={groupKey} className="bg-background">
              <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 border-y">
                {icon}
                <h3 className="font-medium text-sm">{groupName}</h3>
                <Badge variant="outline" className="ml-2">{groupNotifications.length}</Badge>
              </div>
              
              {groupNotifications.map((notif) => {
                const isInterestReceived = notif.type === 'interest_received' || notif.type === 'interest';
                const isReceiverSelected = notif.type === 'receiver_selected' || notif.type === 'selection';

                let displayTitle: React.ReactNode = notif.title;
                let displayContent: React.ReactNode = notif.content;
                let ctaUrl = notif.action_url;
                let ctaLabel: string | null = null;

                if (isInterestReceived) {
                  const name = notif.actor_name || t('someone');
                  const namePart = notif.actor_id ? (
                    <Link
                      to={`/user/${notif.actor_id}`}
                      className="font-semibold text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{name}</span>
                  );
                  displayTitle = (
                    <>
                      {namePart} {t('notifications.is_interested_in_your_pif')}
                      {notif.item_title ? <> "{notif.item_title}"</> : null}
                    </>
                  );
                  displayContent = t('notifications.review_interest_to_select');
                  ctaUrl = notif.item_id ? `/item/${notif.item_id}` : ctaUrl;
                  ctaLabel = t('notifications.review_interest_cta');
                } else if (isReceiverSelected) {
                  displayTitle = t('interactions.receiver_selected_notif_title');
                  displayContent = notif.item_title
                    ? t('notifications.selected_for_item', { title: notif.item_title })
                    : t('interactions.receiver_selected_notif_body');
                  ctaUrl = notif.conversation_id
                    ? `/messages?conversation=${notif.conversation_id}`
                    : notif.item_id
                      ? `/messages?item=${notif.item_id}`
                      : '/messages';
                  ctaLabel = t('interactions.start_conversation');
                }

                return (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !notif.is_read) {
                        e.preventDefault();
                        markAsRead(notif.id);
                      }
                    }}
                    className={`py-3 px-4 flex items-start cursor-pointer transition-colors ${notif.is_read ? "bg-background hover:bg-muted/40" : "bg-primary/5 hover:bg-primary/10"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{displayTitle}</div>
                      {displayContent && (
                        <div className="text-sm text-muted-foreground mt-0.5">{displayContent}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">{new Date(notif.created_at).toLocaleString()}</div>
                      {ctaUrl && ctaLabel && (
                        <Link
                          to={ctaUrl}
                          onClick={() => markAsRead(notif.id)}
                          className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                        >
                          {ctaLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {!ctaLabel && ctaUrl && (
                        <Link to={ctaUrl} onClick={() => markAsRead(notif.id)} className="ml-2">
                          <Button size="icon" variant="ghost" title={t('interactions.view_details')}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      {!notif.is_read && (
                        <Badge variant="outline" className="bg-primary text-primary-foreground border-primary text-xs">{t('interactions.new_badge')}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
