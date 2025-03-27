
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface CommentInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function CommentInput({ onSubmit, placeholder = "Write a comment..." }: CommentInputProps) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="min-h-[50px] py-2 pr-10 resize-none"
        />
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button 
              className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={18} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Picker 
              data={data} 
              onEmojiSelect={handleEmojiSelect}
              theme="light"
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button 
        onClick={handleSubmit} 
        size="sm" 
        className="self-end whitespace-nowrap h-9"
      >
        Post
      </Button>
    </div>
  );
}
