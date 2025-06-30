
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { MessageComposer } from './MessageComposer';
import { formatDistanceToNow } from 'date-fns';

interface ThreadMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  mentions?: string[];
}

interface MessageThreadProps {
  parentMessage: ThreadMessage;
  replies: ThreadMessage[];
  onReply: (content: string, mentions?: string[]) => Promise<void>;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MessageThread({ 
  parentMessage, 
  replies, 
  onReply, 
  isExpanded = false,
  onToggle 
}: MessageThreadProps) {
  const [showComposer, setShowComposer] = useState(false);

  const handleReply = async (content: string, mentions?: string[]) => {
    await onReply(content, mentions);
    setShowComposer(false);
  };

  return (
    <div className="space-y-3">
      {/* Parent Message */}
      <Card className="p-4 border-l-4 border-l-blue-500">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={parentMessage.sender.avatar} />
            <AvatarFallback>{parentMessage.sender.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{parentMessage.sender.name}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(parentMessage.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{parentMessage.content}</p>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="gap-2 text-xs"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(!showComposer)}
                className="gap-2 text-xs"
              >
                <MessageSquare className="h-3 w-3" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Thread Replies */}
      {isExpanded && (
        <div className="ml-8 space-y-3">
          {replies.map((reply) => (
            <Card key={reply.id} className="p-3 bg-gray-50">
              <div className="flex items-start gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reply.sender.avatar} />
                  <AvatarFallback className="text-xs">{reply.sender.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">{reply.sender.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-700">{reply.content}</p>
                  
                  {reply.mentions && reply.mentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reply.mentions.map((mention, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {/* Reply Composer */}
          {showComposer && (
            <div className="mt-3">
              <MessageComposer
                onSendMessage={handleReply}
                placeholder="Reply to thread..."
                maxLength={500}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
