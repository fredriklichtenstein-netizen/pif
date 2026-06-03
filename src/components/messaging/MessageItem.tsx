import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { Message } from "@/types/messaging";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const { i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("sv") ? sv : enUS;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isOwnMessage
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: dateLocale })}
        </div>
      </div>
    </div>
  );
}
