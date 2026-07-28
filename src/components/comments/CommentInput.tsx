
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/utils/safeStorage";

interface CommentInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Identifies this input for draft persistence (e.g. `reply:${commentId}`
   * for a reply box). Defaults to the current pathname, which is unique
   * enough for a page's single main comment box. Pass an explicit key for
   * any input that shares a page with others (like per-comment replies) to
   * avoid draft collisions between them.
   */
  draftKey?: string;
}

export function CommentInput({ onSubmit, placeholder = "Write a comment...", disabled = false, draftKey }: CommentInputProps) {
  const location = useLocation();
  const storageKey = `pif:comment-draft:${draftKey ?? location.pathname}`;
  const [text, setText] = useState(() => safeGetItem(storageKey) ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useGlobalAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const updateText = (value: string) => {
    setText(value);
    if (value) {
      safeSetItem(storageKey, value);
    } else {
      safeRemoveItem(storageKey);
    }
  };

  const requireAuth = (): boolean => {
    if (!user) {
      toast(t('comments.login_to_comment', 'Logga in för att kommentera'));
      navigate('/auth');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    if (!requireAuth()) return;
    onSubmit(text);
    safeRemoveItem(storageKey);
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    updateText(text + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Textarea
          value={text}
          onChange={(e) => updateText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="min-h-[50px] py-2 pr-10 resize-none"
          disabled={disabled}
        />
        <Popover open={showEmojiPicker && !disabled} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button 
              className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
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
        disabled={disabled}
      >
        Post
      </Button>
    </div>
  );
}
