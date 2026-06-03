import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { MoreVertical, Flag, Trash2 } from "lucide-react";
import type { Message, Profile } from "@/types/messaging";
import { UserAvatar } from "./UserAvatar";
import { ProfilePopup } from "./ProfilePopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportPostDialog } from "@/components/item/ReportPostDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  otherProfile?: Profile | null;
  otherUserId?: string;
  otherDisplayName?: string;
  otherInitial?: string;
  itemId?: number | string | null;
  onDelete?: (messageId: string) => void | Promise<void>;
}

export function MessageItem({
  message,
  isOwnMessage,
  otherProfile,
  otherUserId,
  otherDisplayName = "",
  otherInitial = "?",
  itemId,
  onDelete,
}: MessageItemProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("sv") ? sv : enUS;
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDeleted = !!message.deleted_at;

  const bubble = (
    <div
      className={`max-w-[75%] rounded-lg p-3 ${
        isOwnMessage
          ? "bg-primary text-white rounded-br-none"
          : "bg-gray-100 text-gray-800 rounded-bl-none"
      } ${isDeleted ? "italic opacity-70" : ""}`}
    >
      <p className="whitespace-pre-wrap break-words">
        {isDeleted
          ? t("messages.message_deleted_placeholder", {
              defaultValue: "Meddelandet har tagits bort",
            })
          : message.content}
      </p>
      <div
        className={`text-xs mt-1 ${
          isOwnMessage ? "text-primary-foreground/70" : "text-gray-500"
        }`}
      >
        {formatDistanceToNow(new Date(message.created_at), {
          addSuffix: true,
          locale: dateLocale,
        })}
      </div>
    </div>
  );

  // Menu hidden once a message is deleted — no further actions possible.
  const menu = !isDeleted && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("messages.message_actions", {
            defaultValue: "Meddelandeåtgärder",
          })}
          className="opacity-70 hover:opacity-100 md:opacity-50 md:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted text-muted-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
        {isOwnMessage ? (
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("messages.delete_message", { defaultValue: "Ta bort meddelande" })}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            {t("messages.report_message", {
              defaultValue: "Rapportera meddelande",
            })}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className={`group flex items-end gap-2 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      {!isOwnMessage && (
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex-shrink-0 mb-5"
          aria-label={otherDisplayName}
        >
          <UserAvatar
            src={otherProfile?.avatar_url}
            name={otherDisplayName}
            initial={otherInitial}
            className="h-8 w-8 text-xs"
          />
        </button>
      )}

      {isOwnMessage && menu}
      {bubble}
      {!isOwnMessage && menu}

      {!isOwnMessage && (
        <ProfilePopup
          open={profileOpen}
          onOpenChange={setProfileOpen}
          profile={otherProfile}
          userId={otherUserId}
          displayName={otherDisplayName}
          initial={otherInitial}
        />
      )}

      {!isOwnMessage && itemId != null && (
        <ReportPostDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          itemId={itemId}
          commentId={message.id}
          commentText={message.content}
        />
      )}

      {isOwnMessage && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("messages.delete_message_confirm_title", {
                  defaultValue: "Ta bort meddelande?",
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("messages.delete_message_confirm_description", {
                  defaultValue:
                    "Meddelandet tas bort för båda och kan inte återställas.",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("common.cancel", { defaultValue: "Avbryt" })}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setConfirmDelete(false);
                  await onDelete?.(message.id);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("messages.delete_message", {
                  defaultValue: "Ta bort meddelande",
                })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
