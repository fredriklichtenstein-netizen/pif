import { useState } from "react";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const bothDone = pifferConfirmed && receiverConfirmed;
  const pick = (pif: string, wish: string) => (isRequest ? wish : pif);

  const handleConfirm = async () => {
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
          onClick={handleConfirm}
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
        onClick={handleConfirm}
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
    </div>
  );
}
