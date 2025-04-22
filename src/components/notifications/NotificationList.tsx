
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border rounded-lg">
        <MessageSquare className="h-12 w-12 mb-4 text-gray-400 opacity-50" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h2>
        <p className="text-sm text-gray-500">You'll receive updates here.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-medium text-lg">Notifications</div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <div className="divide-y">
        {notifications.map((notif) => (
          <div key={notif.id} className={`py-3 px-4 flex items-start ${notif.is_read ? "opacity-60" : ""}`}>
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
