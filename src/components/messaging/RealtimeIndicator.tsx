
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isConnected: boolean;
  lastSeen?: Date;
  reconnectAttempts: number;
}

export function RealtimeIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Monitor Supabase realtime connection
    const channel = supabase.channel('connection-status');
    
    channel
      .on('system', {}, (payload) => {
        console.log('Realtime system event:', payload);
        setStatus(prev => ({
          ...prev,
          isConnected: payload.status === 'SUBSCRIBED',
          lastSeen: new Date()
        }));
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
        setStatus(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));
      });

    // Simulate typing indicators
    const typingChannel = supabase.channel('typing-indicators');
    
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user, isTyping } = payload.payload;
        setTypingUsers(prev => 
          isTyping 
            ? [...prev.filter(u => u !== user), user]
            : prev.filter(u => u !== user)
        );
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, []);

  const getStatusColor = () => {
    if (status.isConnected) return 'bg-green-500';
    if (status.reconnectAttempts > 0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (status.isConnected) return 'Connected';
    if (status.reconnectAttempts > 0) return 'Reconnecting...';
    return 'Disconnected';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Connection Status */}
      <Badge variant="outline" className="gap-2">
        {status.isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <Circle className={`h-2 w-2 ${getStatusColor()}`} />
        <span className="text-xs">{getStatusText()}</span>
      </Badge>

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <Badge variant="secondary" className="gap-2 animate-pulse">
          <div className="flex gap-1">
            <Circle className="h-1 w-1 bg-blue-500 animate-bounce" />
            <Circle className="h-1 w-1 bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <Circle className="h-1 w-1 bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-xs">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people typing...`
            }
          </span>
        </Badge>
      )}
    </div>
  );
}
