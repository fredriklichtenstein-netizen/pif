import { useState, useRef } from "react";
import { Send, Smile, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useTranslation } from "react-i18next";

interface EnhancedMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  onTyping?: () => void;
}

export const EnhancedMessageInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  onTyping,
}: EnhancedMessageInputProps) => {
  const { t } = useTranslation();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedPlaceholder = placeholder ?? t("messages.type_message");

  const handleSend = async () => {
    if (!value.trim() || disabled || isSending) return;
    try {
      setIsSending(true);
      await onSend();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (onTyping) onTyping();
  };

  const handleEmojiSelect = (emoji: any) => {
    const currentValue = value;
    const cursorPosition = textareaRef.current?.selectionStart || currentValue.length;
    const newValue =
      currentValue.slice(0, cursorPosition) +
      emoji.native +
      currentValue.slice(cursorPosition);

    onChange(newValue);
    setIsEmojiPickerOpen(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          cursorPosition + emoji.native.length,
          cursorPosition + emoji.native.length
        );
      }
    }, 100);
  };

  const sendDisabled = !value.trim() || disabled || isSending;

  return (
    <div className="border-t bg-background p-3">


      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] max-h-32 resize-none pr-12"
            disabled={disabled || isSending}
          />

          <div className="absolute right-2 bottom-2 flex gap-1">
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="top" align="end">
                <EmojiPicker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  previewPosition="none"
                  searchPosition="none"
                  skinTonePosition="none"
                  set="native"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={sendDisabled}
          className="h-12 w-12 shrink-0"
          aria-busy={isSending}
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};
