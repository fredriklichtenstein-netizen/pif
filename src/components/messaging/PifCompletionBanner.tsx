import { useState } from "react";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { PifRole } from "@/hooks/usePifCompletion";

interface Props {
  role: PifRole;
  pifferConfirmed: boolean;
  receiverConfirmed: boolean;
  onConfirm: () => Promise<unknown>;
  onHardComplete: () => void; // opens rating modal
  onUndo?: () => Promise<unknown>;
  /** When true the underlying item is a wish (item_type='request'). */
  isRequest?: boolean;
}

/**
 * Persistent banner above the message input that drives the pif
 * completion handshake between piffer and receiver.
 */
export function PifCompletionBanner({
  role,
  pifferConfirmed,
  receiverConfirmed,
  onConfirm,
  onHardComplete,
  onUndo,
  isRequest = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const bothDone = pifferConfirmed && receiverConfirmed;
  const pick = (pif: string, wish: string) => (isRequest ? wish : pif);

  // Whether clicking confirm right now would be the SECOND (finalizing)
  // confirmation -- i.e. the other party has already confirmed, so this
  // click closes the conversation immediately rather than just recording
  // this user's own side of the handshake.
  const otherAlreadyConfirmed = role === "piffer" ? receiverConfirmed : pifferConfirmed;

  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const handleUndo = async () => {
    if (!onUndo) return;
    setUndoing(true);
    try {
      await onUndo();
    } finally {
      setUndoing(false);
    }
  };

  const confirmDialog = (
    <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          // Same defensive pointer-events reset already applied elsewhere
          // in this codebase for dialogs that close right as a parent
          // re-render (here: the banner swapping for the closed-conversation
          // footer) is in flight.
          e.preventDefault();
          if (typeof document !== "undefined") {
            document.body.style.pointerEvents = "";
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {otherAlreadyConfirmed
              ? pick("Bekräfta att piffen är genomförd?", "Bekräfta att önskan är uppfylld?")
              : pick("Bekräfta din del av bytet?", "Bekräfta din del av bytet?")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {otherAlreadyConfirmed
              ? pick(
                  "Den andra parten har redan bekräftat. Detta markerar piffen som genomförd och stänger konversationen. Den kan öppnas igen inom 7 dagar genom en förfrågan till den andra parten.",
                  "Den andra parten har redan bekräftat. Detta markerar önskan som uppfylld och stänger konversationen. Den kan öppnas igen inom 7 dagar genom en förfrågan till den andra parten.",
                )
              : pick(
                  "Detta bekräftar din del av utbytet. När den andra parten också bekräftar markeras piffen som genomförd och konversationen stängs (kan öppnas igen inom 7 dagar genom en förfrågan).",
                  "Detta bekräftar din del av utbytet. När den andra parten också bekräftar markeras önskan som uppfylld och konversationen stängs (kan öppnas igen inom 7 dagar genom en förfrågan).",
                )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Bekräfta</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (bothDone) {
    return (
      <div className="border-t bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 flex items-center justify-center gap-2">
        <PartyPopper className="h-4 w-4" />
        {pick("Piffen är genomförd! 🎉", "Önskan är uppfylld! 🎉")}
      </div>
    );
  }

  if (role === "piffer") {
    const confirmed = pifferConfirmed;
    // Piffer can always undo before completion (handled at RPC level).
    const canUndo = confirmed && !!onUndo;
    return (
      <div className="border-t bg-muted/40 px-4 py-3 space-y-2">
        <Button
          type="button"
          size="sm"
          variant={confirmed ? "secondary" : "default"}
          disabled={confirmed || busy}
          onClick={() => setConfirmDialogOpen(true)}
          className="w-full justify-center gap-2"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {confirmed
            ? pick(
                "Du har bekräftat överlämning",
                "Du har bekräftat att önskan är uppfylld",
              )
            : pick(
                "Jag har lämnat över piffen ✓",
                "Min önskan är uppfylld ✓",
              )}
        </Button>
        {canUndo && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoing}
              className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
            >
              {undoing ? "Ångrar…" : "Ångra"}
            </button>
          </div>
        )}
        {confirmed && !receiverConfirmed && (
          <>
            <p className="text-xs text-muted-foreground text-center">
              {pick(
                "Väntar på att mottagaren bekräftar mottagning…",
                "Väntar på att den som uppfyllde önskan också bekräftar…",
              )}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onHardComplete}
            >
              Markera som klar ändå
            </Button>
          </>
        )}
        {confirmDialog}
      </div>
    );
  }

  // receiver
  const confirmed = receiverConfirmed;
  // Receiver may only undo BEFORE the piffer has confirmed handoff.
  const canUndo = confirmed && !pifferConfirmed && !!onUndo;
  return (
    <div className="border-t bg-muted/40 px-4 py-3 space-y-2">
      <Button
        type="button"
        size="sm"
        variant={confirmed ? "secondary" : "default"}
        disabled={confirmed || busy}
        onClick={() => setConfirmDialogOpen(true)}
        className="w-full justify-center gap-2"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {confirmed
          ? pick(
              "Du har bekräftat mottagning",
              "Du har bekräftat att önskan är uppfylld",
            )
          : pick(
              "Jag har tagit emot piffen ✓",
              "Jag har uppfyllt önskan ✓",
            )}
      </Button>
      {canUndo && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoing}
            className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
          >
            {undoing ? "Ångrar…" : "Ångra"}
          </button>
        </div>
      )}
      {confirmed && !pifferConfirmed && (
        <p className="text-xs text-muted-foreground text-center">
          {pick(
            "Väntar på att piffaren bekräftar överlämning…",
            "Väntar på att önskaren också bekräftar…",
          )}
        </p>
      )}
      {confirmDialog}
    </div>
  );
}
