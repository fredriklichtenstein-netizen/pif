
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { useRealtimeFeed } from "@/hooks/feed/useRealtimeFeed";

interface RealtimeIndicatorProps {
  posts: any[];
  onPostUpdate: (posts: any[]) => void;
}

export function RealtimeIndicator({ posts, onPostUpdate }: RealtimeIndicatorProps) {
  const { isRealtime, connectionStatus, startRealtime, stopRealtime } = useRealtimeFeed(posts, onPostUpdate);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (isRealtime) {
      // Simulate update count for demo
      const interval = setInterval(() => {
        setUpdateCount(prev => prev + Math.floor(Math.random() * 3));
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isRealtime]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-3 w-3" />;
      case 'connecting': return <Activity className="h-3 w-3 animate-spin" />;
      case 'disconnected': return <WifiOff className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <Badge variant="outline" className="text-xs">
          {getStatusIcon()}
          <span className="ml-1 capitalize">{connectionStatus}</span>
        </Badge>
      </div>
      
      {isRealtime && (
        <Badge variant="secondary" className="text-xs">
          {updateCount} updates
        </Badge>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={isRealtime ? stopRealtime : startRealtime}
        className="text-xs"
      >
        {isRealtime ? 'Disable' : 'Enable'} Live Updates
      </Button>
    </div>
  );
}
