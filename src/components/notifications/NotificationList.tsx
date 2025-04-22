
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function NotificationList() {
  const {
    notifications,
    isLoading,
    fetchError,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

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
      <div className="text-center text-gray-500 py-12">
        <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-30" />
        <div>No notifications yet</div>
        <div className="text-xs mt-1 text-gray-400">You'll receive updates here.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <div className="font-medium text-lg">Notifications</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <div className="divide-y">
        {notifications.map((notif) => (
          <div key={notif.id} className={`py-3 px-1 flex items-start ${notif.is_read ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-primary">{notif.type.replace(/_/g, " ").toUpperCase()}</span>
              <div className="font-semibold">{notif.title}</div>
              {notif.content && (
                <div className="text-sm text-gray-700 mt-0.5">{notif.content}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</div>
            </div>
            {notif.action_url && (
              <Link to={notif.action_url} className="ml-2">
                <Button size="icon" variant="ghost" title="Go to item">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {!notif.is_read && <Badge variant="outline" className="ml-2 text-xs">New</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
