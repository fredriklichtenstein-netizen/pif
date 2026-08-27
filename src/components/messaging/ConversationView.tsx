import { useState, useEffect, useRef, useCallback } from "react";
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
import { ArrowLeft, MoreVertical, Flag, RotateCcw, Archive, UserMinus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PifCompletionBanner } from "./PifCompletionBanner";
import { PifRatingModal } from "./PifRatingModal";
import { ReportPostDialog } from "@/components/item/ReportPostDialog";
import type { WithdrawCopy } from "@/hooks/item/useWithdrawInterestConfirm";
import { withdrawPreSelectionInterest } from "@/hooks/item/interest/withdrawPreSelection";
import { usePifCompletion } from "@/hooks/usePifCompletion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/utils/safeStorage";

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const messageDraftKey = (conversationId: string) => `pif:message-draft:${conversationId}`;

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
  const [newMessage, setNewMessage] = useState(() => safeGetItem(messageDraftKey(conversationId)) ?? "");
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReceiverOpen, setWithdrawReceiverOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenComment, setReopenComment] = useState("");
  const [reopenBusy, setReopenBusy] = useState(false);
  const [respondBusy, setRespondBusy] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
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

  // reopened_at overrides closure permanently once the other party approves
  // a reopen request -- the underlying pif_status/closed_at are untouched
  // (per design, reopening the conversation never changes the transaction's
  // own state), only this flag lets the thread accept messages again.
  const reopenedAt = conversation?.reopened_at ?? null;
  const reopenRequestedBy = conversation?.reopen_requested_by ?? null;
  const reopenRequestComment = conversation?.reopen_request_comment ?? null;

  const isClosed =
    (!!conversation?.closed_at ||
      completion.pifStatus === "completed" ||
      completion.pifStatus === "archived") &&
    !reopenedAt;

  // The reopen-request option is only offered for a *completed* exchange
  // (not archived), and only within 7 days of both parties confirming.
  const completedAtMs = completion.completedAt ? new Date(completion.completedAt).getTime() : null;
  const reopenWindowOpen =
    completion.pifStatus === "completed" &&
    completedAtMs !== null &&
    Date.now() <= completedAtMs + REOPEN_WINDOW_MS;
  const isMyPendingReopenRequest = !!reopenRequestedBy && reopenRequestedBy === currentUserId;
  const isOtherPendingReopenRequest =
    !!reopenRequestedBy && reopenRequestedBy !== currentUserId;
  const canRequestReopen =
    isClosed && reopenWindowOpen && !reopenedAt && !reopenRequestedBy;

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

  // This component stays mounted across conversation switches (no `key`
  // prop from the parent), so the lazy useState initializer above only
  // loads the right draft on first mount -- reload it here whenever the
  // conversation actually changes.
  useEffect(() => {
    setNewMessage(safeGetItem(messageDraftKey(conversationId)) ?? "");
  }, [conversationId]);

  useEffect(() => {
    const key = messageDraftKey(conversationId);
    if (newMessage) {
      safeSetItem(key, newMessage);
    } else {
      safeRemoveItem(key);
    }
  }, [newMessage, conversationId]);

  // Deliberately NOT using scrollIntoView -- it targets whichever
  // scrollable ancestor it decides on and can be interrupted mid-animation,
  // both of which were suspected in earlier live testing that still
  // didn't reliably land at the bottom. Setting scrollTop directly is the
  // one thing guaranteed to work regardless of ancestor/animation quirks.
  const doScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (messagesLoading) return;
    if (messages.length === 0) return;

    // Run after paint, then a few more times over the next ~500ms to
    // catch layout still settling (avatars/images loading late, or on
    // mobile the on-screen keyboard closing after tapping Send, which
    // resizes this dvh-based container -- see Messages.tsx -- without
    // `messages` changing).
    const raf = requestAnimationFrame(() => {
      doScroll();
      hasInitiallyScrolledRef.current = true;
    });
    const delays = [50, 150, 300, 500];
    const timeouts = delays.map((ms) => window.setTimeout(doScroll, ms));

    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [messages, messagesLoading, conversationId, doScroll]);

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
    //
    // setTimeout, not requestAnimationFrame: rAF callbacks are suspended
    // for as long as the tab/window is hidden (backgrounded app, switched
    // tabs mid-tap), which would leave this callback -- and any busy-state
    // flag gating a disabled button -- stuck pending indefinitely. A
    // macrotask timeout still runs on the very next tick either way, but
    // isn't tied to the rendering pipeline.
    setWithdrawOpen(false);
    setTimeout(async () => {
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
    }, 0);
  };

  // Same copy pattern as InterestSelectionList's self-withdraw dialog
  // (selfWithdrawCopy) — reused so both entry points to a receiver's own
  // withdrawal stay in sync.
  const withdrawReceiverCopy: WithdrawCopy = isRequest
    ? {
        title: t("interactions.withdraw_offer_title"),
        description: t("interactions.withdraw_offer_description"),
        cancel: t("interactions.withdraw_offer_cancel"),
        confirm: t("interactions.withdraw_offer_confirm"),
      }
    : {
        title: t("interactions.withdraw_interest_title"),
        description: t("interactions.withdraw_interest_description"),
        cancel: t("interactions.withdraw_interest_cancel"),
        confirm: t("interactions.withdraw_interest_confirm"),
      };

  // Receiver's own "withdraw my interest" action, mirroring
  // InterestSelectionList.handleWithdrawOwnOffer: always try
  // withdraw_receiver first (closes the conversation, resets item state,
  // notifies the owner); only fall back to the shared pre-selection
  // delete helper if Postgres rejects with 42501 ("Not the selected
  // receiver"), which withdrawPreSelectionInterest itself now also
  // guards against deleting a still-selected row.
  const handleWithdrawReceiverInterest = () => {
    setWithdrawReceiverOpen(false);
    // setTimeout, not requestAnimationFrame -- see handleWithdraw above.
    setTimeout(async () => {
      if (!item?.id || !currentUserId) return;
      const numericItemId = parseInt(String(item.id), 10);
      if (!Number.isFinite(numericItemId)) return;
      try {
        const { error } = await (supabase.rpc as any)("withdraw_receiver", {
          p_item_id: numericItemId,
          p_comment: null,
        });
        if (error) {
          const code = (error as any)?.code;
          const msg = String((error as any)?.message || "");
          const isNotSelected =
            code === "42501" || /not the selected receiver/i.test(msg);
          if (isNotSelected) {
            await withdrawPreSelectionInterest(numericItemId, currentUserId);
          } else {
            throw error;
          }
        }
        window.dispatchEvent(new CustomEvent("pif:conversation-refetch"));
        window.dispatchEvent(new CustomEvent("pif:conversations-refresh"));
        toast({ title: t("interactions.selection_withdrawn") });
        if (isRequest) {
          // Wish: the item itself stays active, only this single
          // conversation closes. Stay on the thread; refetch flips UI.
          return;
        }
        // Pif: thread is over — leave it.
        if (onBack) onBack();
        else navigate("/messages");
      } catch (e) {
        console.error("[ConversationView] withdraw receiver interest failed", e);
        toast({
          variant: "destructive",
          title: t("interactions.error_title"),
          description: t("interactions.error_withdraw_selection"),
        });
      }
    }, 0);
  };

  const handleRequestReopen = async () => {
    setReopenBusy(true);
    try {
      const res = await completion.requestReopen(reopenComment);
      if (res.ok) {
        setReopenDialogOpen(false);
        setReopenComment("");
      }
    } finally {
      setReopenBusy(false);
    }
  };

  const handleRespondReopen = (approve: boolean) => {
    setRespondBusy(true);
    // setTimeout, not requestAnimationFrame -- see handleWithdraw above.
    // Caught live: with the tab backgrounded, the rAF callback never fired,
    // leaving respondBusy (and the Approve/Decline buttons) stuck disabled
    // forever since the deferred RPC call itself never ran.
    setTimeout(async () => {
      try {
        await completion.respondToReopen(approve);
      } finally {
        setRespondBusy(false);
      }
    }, 0);
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
              {role === "receiver" && !isClosed && (
                <>
                  <DropdownMenuItem
                    onClick={() => setWithdrawReceiverOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    {isRequest
                      ? t("interactions.withdraw_offer_confirm")
                      : t("interactions.withdraw_interest_confirm")}
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

      {/* Completion banner — only while the pif/wish itself is still
          unresolved. Gated on pifStatus rather than isClosed so that a
          REOPENED conversation (pif already completed, only the thread was
          reopened) shows just the message input, not a redundant "already
          completed" celebration banner re-appearing above it. */}
      {completion.pifStatus !== "completed" &&
        completion.pifStatus !== "archived" &&
        !completion.loading &&
        item && (
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
          <div className="border-t bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground space-y-2">
            <p>
              {completion.pifStatus === "archived"
                ? (isRequest ? "Önskan har arkiverats — konversationen är avslutad." : "Piffen har arkiverats — konversationen är avslutad.")
                : completion.pifStatus === "completed"
                  ? (isRequest ? "Önskan är uppfylld — konversationen är avslutad." : "Piffen är genomförd — konversationen är avslutad.")
                  : "Den här konversationen är avslutad."}
            </p>

            {isOtherPendingReopenRequest ? (
              <div className="rounded-md border bg-background p-3 text-left space-y-2">
                <p className="text-sm text-foreground">
                  {otherName} vill öppna konversationen igen.
                  {reopenRequestComment ? ` "${reopenRequestComment}"` : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    disabled={respondBusy}
                    onClick={() => handleRespondReopen(true)}
                  >
                    Öppna igen
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={respondBusy}
                    onClick={() => handleRespondReopen(false)}
                  >
                    Avböj
                  </Button>
                </div>
              </div>
            ) : isMyPendingReopenRequest ? (
              <p className="text-xs">
                Du har bett om att öppna konversationen igen. Väntar på svar…
              </p>
            ) : canRequestReopen ? (
              <button
                type="button"
                onClick={() => setReopenDialogOpen(true)}
                className="text-xs text-primary underline hover:text-primary/80"
              >
                Öppna konversationen igen
              </button>
            ) : null}
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

      {/* Reopen-request dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (typeof document !== "undefined") {
              document.body.style.pointerEvents = "";
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Öppna konversationen igen?</DialogTitle>
            <DialogDescription>
              {`${otherName} måste godkänna innan ni kan skriva igen. Detta ändrar inte statusen på ${isRequest ? "önskan" : "piffen"} — bara konversationen öppnas.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Valfri kommentar…"
            value={reopenComment}
            onChange={(e) => setReopenComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReopenDialogOpen(false)}
              disabled={reopenBusy}
            >
              Avbryt
            </Button>
            <Button type="button" onClick={handleRequestReopen} disabled={reopenBusy}>
              Skicka förfrågan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  Vill du återöppna piffen så att andra kan visa intresse, eller arkivera den helt?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  onClick={() => handleWithdraw("reopen")}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Återöppna piffen
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => handleWithdraw("archive")}
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arkivera piffen
                </AlertDialogAction>
                <AlertDialogCancel className="w-full mt-0">
                  Avbryt
                </AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw-my-interest dialog (receiver only) */}
      <AlertDialog open={withdrawReceiverOpen} onOpenChange={setWithdrawReceiverOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            // Same Radix body `pointer-events: none` leak as the piffer
            // withdraw dialog above -- this one also flips isClosed +
            // swaps the footer on confirm, so it needs the same cleanup.
            // Confirmed live: without this, the app froze after a
            // successful withdrawal until a manual page refresh.
            e.preventDefault();
            if (typeof document !== "undefined") {
              document.body.style.pointerEvents = "";
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{withdrawReceiverCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{withdrawReceiverCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{withdrawReceiverCopy.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawReceiverInterest}>
              {withdrawReceiverCopy.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
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
