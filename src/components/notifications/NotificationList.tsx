
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

export function NotificationList() {
  const {
    notifications,
    isLoading,
    fetchError,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return {};
    
    return notifications.reduce((groups, notification) => {
      // Normalize type name for grouping
      const type = notification.type.split('_')[0] || 'other';
      
      if (!groups[type]) {
        groups[type] = [];
      }
      
      groups[type].push(notification);
      return groups;
    }, {} as Record<string, typeof notifications>);
  }, [notifications]);

  // Define group display names and icons
  const groupDisplayInfo = {
    interest: { name: "Interest Updates", icon: <AlertCircle className="h-5 w-5 text-blue-500" /> },
    status: { name: "PIF Status Changes", icon: <Clock className="h-5 w-5 text-green-500" /> },
    comment: { name: "Comments", icon: <MessageSquare className="h-5 w-5 text-purple-500" /> },
    profile: { name: "Profile Interactions", icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
    other: { name: "Other Notifications", icon: <AlertCircle className="h-5 w-5 text-gray-500" /> },
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading notifications...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center text-red-500 py-6">
        {fetchError.message}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border rounded-lg">
        <MessageSquare className="h-12 w-12 mb-4 text-gray-400 opacity-50" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h2>
        <p className="text-sm text-gray-500">You'll receive updates about PIFs, comments, and other community activity here.</p>
      </div>
    );
  }

  const sortedGroupKeys = Object.keys(groupedNotifications).sort((a, b) => {
    // Sort by most recent notification in each group
    const mostRecentA = groupedNotifications[a][0]?.created_at || '';
    const mostRecentB = groupedNotifications[b][0]?.created_at || '';
    return new Date(mostRecentB).getTime() - new Date(mostRecentA).getTime();
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-white sticky top-0 z-10">
        <div className="font-medium text-lg">Notifications</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      
      <div className="divide-y">
        {sortedGroupKeys.map(groupKey => {
          const groupNotifications = groupedNotifications[groupKey];
          const { name: groupName, icon } = groupDisplayInfo[groupKey as keyof typeof groupDisplayInfo] || 
                                           groupDisplayInfo.other;
          
          return (
            <div key={groupKey} className="bg-white">
              <div className="px-4 py-2 bg-gray-50 flex items-center gap-2 border-y">
                {icon}
                <h3 className="font-medium text-sm">{groupName}</h3>
                <Badge variant="outline" className="ml-2">{groupNotifications.length}</Badge>
              </div>
              
              {groupNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`py-3 px-4 flex items-start ${notif.is_read ? "bg-white" : "bg-blue-50"}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{notif.title}</div>
                    {notif.content && (
                      <div className="text-sm text-gray-700 mt-0.5">{notif.content}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {notif.action_url && (
                      <Link to={notif.action_url} className="ml-2">
                        <Button size="icon" variant="ghost" title="View details">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    
                    {!notif.is_read && (
                      <Badge variant="outline" className="bg-primary text-white border-primary text-xs">New</Badge>
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
