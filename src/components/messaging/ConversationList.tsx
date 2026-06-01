import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import type { Conversation } from "@/types/messaging";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resolveDisplayName, resolveAvatarInitial } from "@/utils/displayName";
import { UserAvatar } from "./UserAvatar";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const isHistoricStatus = (status: string | undefined): boolean => {
  const s = (status || "").toLowerCase();
  // Anything that isn't an active pif goes to history (completed, archived,
  // cancelled, pending confirmation that has been resolved, etc.)
  return s === "completed" || s === "archived" || s === "cancelled";
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useGlobalAuth();
  const currentUserId = user?.id;
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("sv") ? sv : enUS;
  const [historyOpen, setHistoryOpen] = useState(false);

  const fallbackName = t("messages.unknown_user");
  const fallbackInitial = fallbackName.charAt(0).toUpperCase();

  const { active, history } = useMemo(() => {
    const a: Conversation[] = [];
    const h: Conversation[] = [];
    for (const c of conversations) {
      if (isHistoricStatus(c.item?.status)) h.push(c);
      else a.push(c);
    }
    return { active: a, history: h };
  }, [conversations]);

  const renderItem = (conversation: Conversation, isHistory: boolean) => {
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    const displayName = resolveDisplayName(otherParticipant?.profile, fallbackName);
    const initial = resolveAvatarInitial(otherParticipant?.profile, fallbackInitial);
    const preview = conversation.last_message_text?.trim();

    return (
      <div
        key={conversation.id}
        className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
          activeConversationId === conversation.id ? "bg-accent" : ""
        } ${isHistory ? "opacity-80" : ""}`}
        onClick={() => onSelectConversation(conversation.id)}
      >
        <div className="flex items-start gap-3">
          {otherParticipant?.user_id ? (
            <Link
              to={`/user/${otherParticipant.user_id}`}
              className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {otherParticipant?.profile?.avatar_url ? (
                <img
                  src={otherParticipant.profile.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground font-medium">
                  {initial}
                </div>
              )}
            </Link>
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground font-medium">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-medium truncate flex items-center gap-1.5">
                {displayName}
                {isHistory && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" aria-label={t("messages.completed_badge")} />
                )}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.updated_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {preview || t("interactions.no_messages_yet_short")}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b">
        <h3 className="font-medium">{t("interactions.conversations_title")}</h3>
      </div>

      {/* Active section */}
      <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("messages.active_section")} ({active.length})
      </div>
      <div className="divide-y">
        {active.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            {t("messages.active_empty")}
          </div>
        ) : (
          active.map((c) => renderItem(c, false))
        )}
      </div>

      {/* History section (collapsed by default) */}
      <div className="border-t mt-2">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent/50"
          aria-expanded={historyOpen}
        >
          <span>
            {t("messages.history_section")} ({history.length})
          </span>
          {historyOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {historyOpen && (
          <div className="divide-y border-t">
            {history.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                {t("messages.history_empty")}
              </div>
            ) : (
              history.map((c) => renderItem(c, true))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
