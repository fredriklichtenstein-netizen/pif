import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { MessageItem } from "./MessageItem";
import { useAuth } from "@/hooks/useAuth";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedMessageInput } from "./EnhancedMessageInput";
import { useTranslation } from "react-i18next";
import { resolveDisplayName } from "@/utils/displayName";
import { UserAvatar } from "./UserAvatar";
import { ProfilePopup } from "./ProfilePopup";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Flag, RotateCcw, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PifCompletionBanner } from "./PifCompletionBanner";
import { PifRatingModal } from "./PifRatingModal";
import { ReportPostDialog } from "@/components/item/ReportPostDialog";
import { usePifCompletion } from "@/hooks/usePifCompletion";
import { supabase } from "@/integrations/supabase/client";

interface ConversationViewProps {
  conversationId: string;
  onBack?: () => void;
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasInitiallyScrolledRef = useRef(false);
  const [newMessage, setNewMessage] = useState("");
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { t } = useTranslation();
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    deleteMessage,
  } = useMessages(conversationId);
  const {
    conversation,
    otherParticipant,
    item,
    isLoading: detailsLoading,
  } = useConversationDetails(conversationId);
  

  const fallbackName = t("messages.unknown_user");
  const otherName = resolveDisplayName(otherParticipant?.profile, fallbackName);

  const itemOwnerId = item?.postedBy?.id;
  const isCurrentUserPiffer = !!itemOwnerId && itemOwnerId === currentUserId;
  const role: "piffer" | "receiver" = isCurrentUserPiffer ? "piffer" : "receiver";

  const completion = usePifCompletion(
    conversationId,
    item?.id ?? null,
    currentUserId,
    otherParticipant?.user_id,
  );
  // Drive every wish-vs-pif copy switch from the hook's authoritative
  // item_type read. Temporary sanity log so silent "always false"
  // derivations are caught early instead of surfacing as a copy bug.
  const isRequest = !!completion.isRequest;
  useEffect(() => {
    if (item?.id != null && !completion.loading) {
      console.log("[copy-audit] ConversationView isRequest", {
        itemId: item.id,
        itemTitle: item.title,
        isRequest,
        role,
      });
    }
  }, [item?.id, item?.title, completion.loading, isRequest, role]);

  const isClosed =
    !!conversation?.closed_at ||
    completion.pifStatus === "completed" ||
    completion.pifStatus === "archived";

  const roleLabel = item
    ? isCurrentUserPiffer
      ? t(isRequest ? "messages.role_you_wish" : "messages.role_you_pif", {
          defaultValue: isRequest ? "Du önskar: {{title}}" : "Du piffar: {{title}}",
          title: item.title,
        })
      : t(isRequest ? "messages.role_you_fulfill_wish" : "messages.role_you_receive", {
          defaultValue: isRequest ? "Du uppfyller: {{title}}" : "Du tar emot: {{title}}",
          title: item.title,
        })
    : null;

  // Reset initial-scroll flag when switching conversations
  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (messagesLoading) return;
    if (messages.length === 0) return;

    const isInitial = !hasInitiallyScrolledRef.current;
    const behavior: ScrollBehavior = isInitial ? "auto" : "smooth";

    const doScroll = () => {
      const end = messagesEndRef.current;
      const container = messagesContainerRef.current;
      if (end && typeof end.scrollIntoView === "function") {
        end.scrollIntoView({ behavior, block: "end" });
      }
      // Fallback: force the container itself, in case scrollIntoView
      // bubbled to the wrong ancestor (e.g. page-level scroll).
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Run after paint, then once more shortly after to catch late
    // layout shifts from avatars/images loading in message rows.
    const raf = requestAnimationFrame(() => {
      doScroll();
      hasInitiallyScrolledRef.current = true;
    });
    const t1 = window.setTimeout(doScroll, 80);
    const t2 = window.setTimeout(doScroll, 300);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [messages, messagesLoading, conversationId]);

  // If piffer just completed both sides via confirm, surface rating modal once.
  // We intentionally do NOT gate on pifStatus !== "completed" here because the
  // confirm_pif_handoff RPC may auto-flip pif_status to "completed" the same
  // moment both flags become true (one realtime UPDATE). Instead, if the pif
  // was ALREADY completed when this view first loaded, we suppress the prompt
  // (the piffer presumably already rated). Otherwise we prompt the first time
  // we observe both sides confirmed in this session.
  const ratedPromptedRef = useRef(false);
  const initialStatusSeenRef = useRef(false);
  const initialStatusCapturedRef = useRef(false);

  useEffect(() => {
    ratedPromptedRef.current = false;
    initialStatusSeenRef.current = false;
    initialStatusCapturedRef.current = false;
    setRatingOpen(false);
  }, [conversationId, item?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadHasRated = async () => {
      const otherUserId = otherParticipant?.user_id;
      if (role !== "piffer" || !item?.id || !otherUserId) {
        if (!cancelled) setHasRated(false);
        return;
      }
      const numericItemId = parseInt(String(item.id), 10);
      if (!Number.isFinite(numericItemId)) return;
      // Scope by the conversation's other participant so this lookup is
      // safe on wishes (which can have multiple selected helpers).
      const { data, error } = await (supabase.from("interests") as any)
        .select("receiver_rating")
        .eq("item_id", numericItemId)
        .eq("status", "selected")
        .eq("user_id", otherUserId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[PifRatingModal] hasRated lookup failed", error);
        return;
      }
      setHasRated(data?.receiver_rating != null);
    };
    loadHasRated();
    return () => {
      cancelled = true;
    };
  }, [role, item?.id, otherParticipant?.user_id]);

  useEffect(() => {
    if (!item?.id) return;
    if (completion.loading) return;
    if (!initialStatusCapturedRef.current && completion.pifStatus === null) return;
    if (!initialStatusCapturedRef.current) {
      initialStatusSeenRef.current =
        completion.pifStatus === "completed" || completion.pifStatus === "archived";
      initialStatusCapturedRef.current = true;
    }
    const isPiffer = role === "piffer";
    const shouldOpenRating =
      completion.pifStatus === "completed" &&
      isPiffer &&
      !initialStatusSeenRef.current &&
      !hasRated;
    console.log("[PifRatingModal] trigger evaluation", {
      pifStatus: completion.pifStatus,
      isPiffer,
      initialStatusSeenRef: initialStatusSeenRef.current,
      hasRated,
      shouldOpenRating,
    });
    if (shouldOpenRating && !ratedPromptedRef.current) {
      ratedPromptedRef.current = true;
      setRatingOpen(true);
    }
  }, [
    role,
    item?.id,
    completion.loading,
    completion.pifStatus,
    hasRated,
  ]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleWithdraw = (action: "reopen" | "archive") => {
    // Close the dialog FIRST so Radix runs its unmount + body-style
    // cleanup against a stable tree. Running the RPC (and the
    // subsequent isClosed flip + footer/input swap) before close
    // leaves `pointer-events: none` stuck on <body>, deadening the
    // whole page until manual refresh.
    setWithdrawOpen(false);
    requestAnimationFrame(async () => {
      const res = await completion.withdraw(action);
      if (!res.ok) return;
      if (isRequest) {
        // Wish: the item itself stays active, only this single
        // conversation closes. Stay on the thread; refetch flips UI.
        return;
      }
      // Pif: thread is over — leave it.
      if (onBack) onBack();
      else navigate("/messages");
    });
  };

  if (detailsLoading) {
    return (
      <div className="h-full p-4">
        <div className="border-b pb-3 mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-2/3 ml-auto" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Conversation header */}
      <div className="border-b p-3 bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 -ml-1"
              onClick={onBack}
              aria-label={t("common.back", { defaultValue: "Tillbaka" })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setHeaderProfileOpen(true)}
            className="flex-shrink-0"
            aria-label={otherName}
          >
            <UserAvatar
              src={otherParticipant?.profile?.avatar_url}
              name={otherName}
              size={40}
              className="h-10 w-10"
            />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{otherName}</h3>
            {roleLabel && (
              <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Mer"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {role === "piffer" && !isClosed && (
                <>
                  <DropdownMenuItem onClick={() => setWithdrawOpen(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isRequest ? "Ångra val av uppfyllare" : "Ångra val av mottagare"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                <Flag className="h-4 w-4 mr-2" />
                Rapportera problem med detta utbyte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProfilePopup
        open={headerProfileOpen}
        onOpenChange={setHeaderProfileOpen}
        profile={otherParticipant?.profile}
        userId={otherParticipant?.user_id}
        displayName={otherName}
      />

      {/* Scrollable message list */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {fulfillerNote && (
          <div className="flex justify-center my-2">
            <div className="max-w-[85%] rounded-lg bg-muted/60 border border-border px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                {t("messages.system_message_label", { defaultValue: "Systemmeddelande" })}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {fulfillerNote}
              </p>
            </div>
          </div>
        )}
        {messagesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{t("interactions.no_messages")}</p>
            <p className="text-sm mt-2">{t("interactions.send_to_start")}</p>
          </div>
        ) : (
          <>
            {messages
              .filter((m) =>
                !m.is_system_message ||
                !m.target_user_id ||
                m.target_user_id === currentUserId,
              )
              .map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwnMessage={
                    !message.is_system_message && message.sender_id === currentUserId
                  }
                  otherProfile={otherParticipant?.profile}
                  otherUserId={otherParticipant?.user_id}
                  otherDisplayName={otherName}
                  itemId={item?.id}
                  onDelete={deleteMessage}
                />
              ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Completion banner — only while pif is active */}
      {!isClosed && !completion.loading && item && (
        <PifCompletionBanner
          role={role}
          pifferConfirmed={completion.pifferConfirmed}
          receiverConfirmed={completion.receiverConfirmed}
          onConfirm={() => completion.confirmHandoff(role)}
          onHardComplete={() => setRatingOpen(true)}
          onUndo={() => completion.undoConfirmation(role)}
          isRequest={isRequest}
        />
      )}

      {/* Message input OR read-only status */}
      <div className="flex-shrink-0">
        {isClosed ? (
          <div className="border-t bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            {completion.pifStatus === "archived"
              ? (isRequest ? "Önskan har arkiverats — konversationen är avslutad." : "Pifen har arkiverats — konversationen är avslutad.")
              : completion.pifStatus === "completed"
                ? (isRequest ? "Önskan är uppfylld — konversationen är avslutad." : "Pifen är genomförd — konversationen är avslutad.")
                : "Den här konversationen är avslutad."}
          </div>
        ) : (
          <EnhancedMessageInput
            value={newMessage}
            onChange={setNewMessage}
            onSend={handleSendMessage}
            placeholder={t("messages.type_message")}
          />
        )}
      </div>

      {/* Piffer rating modal */}
      {role === "piffer" && (
        <PifRatingModal
          open={ratingOpen}
          onOpenChange={setRatingOpen}
          onSubmit={async (rating, comment) => {
            const res = await completion.completeWithRating(rating, comment);
            if (res.ok) setHasRated(true);
            return res;
          }}
          onLowRatingReport={() => setReportOpen(true)}
          isRequest={isRequest}
        />
      )}

      {/* Withdraw choice dialog (piffer only) */}
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            // Defensive cleanup for the Radix body `pointer-events: none`
            // leak that occasionally survives when the parent tree
            // re-renders (isClosed flip, footer/input swap) during close.
            e.preventDefault();
            if (typeof document !== "undefined") {
              document.body.style.pointerEvents = "";
            }
          }}
        >
          {isRequest ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{`Ångra val av ${otherName} som uppfyllare`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {`${otherName} är inte längre vald att uppfylla din önskan. Andra valda uppfyllare påverkas inte, och din önskan ligger kvar som den är.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  onClick={() => handleWithdraw("reopen")}
                  className="w-full"
                >
                  Ångra valet
                </AlertDialogAction>
                <AlertDialogCancel className="w-full mt-0">
                  Avbryt
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Ångra val av mottagare</AlertDialogTitle>
                <AlertDialogDescription>
                  Vill du återöppna pifen så att andra kan visa intresse, eller arkivera den helt?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  onClick={() => handleWithdraw("reopen")}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Återöppna pifen
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => handleWithdraw("archive")}
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arkivera pifen
                </AlertDialogAction>
                <AlertDialogCancel className="w-full mt-0">
                  Avbryt
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog (both parties) */}
      {item && (
        <ReportPostDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          itemId={item.id}
        />
      )}
    </div>
  );
}
