
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function NotificationList() {
  const { t } = useTranslation();
  const {
    notifications,
    isLoading,
    fetchError,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const groupedNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return {};
    
    return notifications.reduce((groups, notification) => {
      const type = notification.type.split('_')[0] || 'other';
      
      if (!groups[type]) {
        groups[type] = [];
      }
      
      groups[type].push(notification);
      return groups;
    }, {} as Record<string, typeof notifications>);
  }, [notifications]);

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

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-background sticky top-0 z-10">
        <div className="font-medium text-lg">{t('interactions.notifications_title')}</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            {t('interactions.mark_all_read')}
          </Button>
        )}
      </div>
      
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
              
              {groupNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`py-3 px-4 flex items-start ${notif.is_read ? "bg-background" : "bg-primary/5"}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{notif.title}</div>
                    {notif.content && (
                      <div className="text-sm text-muted-foreground mt-0.5">{notif.content}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(notif.created_at).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {notif.action_url && (
                      <Link to={notif.action_url} className="ml-2">
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
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
