
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile, Paperclip, AtSign, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageComposerProps {
  onSendMessage: (content: string, mentions?: string[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  allowMentions?: boolean;
  maxLength?: number;
}

interface Mention {
  id: string;
  name: string;
  avatar?: string;
}

export function MessageComposer({ 
  onSendMessage, 
  placeholder = "Type your message...", 
  disabled = false,
  allowMentions = true,
  maxLength = 1000
}: MessageComposerProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock users for mentions - replace with real data
  const availableUsers: Mention[] = [
    { id: '1', name: 'Emma Andersson', avatar: '' },
    { id: '2', name: 'Lars Nilsson', avatar: '' },
    { id: '3', name: 'Maria Santos', avatar: '' },
    { id: '4', name: 'Johan Berg', avatar: '' }
  ];

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const mentionIds = mentions.map(m => m.id);
      await onSendMessage(message.trim(), mentionIds);
      setMessage('');
      setMentions([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      
      // Check for @ mentions
      const lastWord = value.split(/\s/).pop() || '';
      if (allowMentions && lastWord.startsWith('@') && lastWord.length > 1) {
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    }
  };

  const addMention = (user: Mention) => {
    const words = message.split(/\s/);
    words[words.length - 1] = `@${user.name} `;
    setMessage(words.join(' '));
    setMentions(prev => [...prev.filter(m => m.id !== user.id), user]);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const removeMention = (mentionId: string) => {
    setMentions(prev => prev.filter(m => m.id !== mentionId));
  };

  const addEmoji = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const remainingChars = maxLength - message.length;

  return (
    <Card className="p-4">
      {/* Mentions */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {mentions.map(mention => (
            <Badge key={mention.id} variant="secondary" className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={mention.avatar} />
                <AvatarFallback className="text-xs">{mention.name[0]}</AvatarFallback>
              </Avatar>
              {mention.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 ml-1"
                onClick={() => removeMention(mention.id)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[80px] resize-none pr-12"
            style={{ height: 'auto' }}
          />
          
          {/* Mention suggestions */}
          {showMentions && (
            <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto z-10">
              <div className="p-2">
                {availableUsers
                  .filter(user => !mentions.find(m => m.id === user.id))
                  .map(user => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => addMention(user)}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </Button>
                  ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Emoji picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disabled}>
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 border-0" align="start">
                <Picker
                  data={data}
                  onEmojiSelect={addEmoji}
                  theme="light"
                  previewPosition="none"
                />
              </PopoverContent>
            </Popover>

            {/* Attachment button */}
            <Button variant="ghost" size="sm" disabled={disabled}>
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Mention button */}
            {allowMentions && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  setMessage(prev => prev + '@');
                  textareaRef.current?.focus();
                }}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-400'}`}>
              {remainingChars}
            </span>
            
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled || isLoading}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
