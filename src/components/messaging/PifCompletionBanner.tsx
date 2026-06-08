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
}: Props) {
  const [busy, setBusy] = useState(false);
  const bothDone = pifferConfirmed && receiverConfirmed;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  if (bothDone) {
    return (
      <div className="border-t bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 flex items-center justify-center gap-2">
        <PartyPopper className="h-4 w-4" />
        Piffen är genomförd! 🎉
      </div>
    );
  }

  if (role === "piffer") {
    const confirmed = pifferConfirmed;
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
            ? "Du har bekräftat överlämning"
            : "Jag har lämnat över piffen ✓"}
        </Button>
        {confirmed && !receiverConfirmed && (
          <>
            <p className="text-xs text-muted-foreground text-center">
              Väntar på att mottagaren bekräftar mottagning…
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
          ? "Du har bekräftat mottagning"
          : "Jag har tagit emot piffen ✓"}
      </Button>
      {confirmed && !pifferConfirmed && (
        <p className="text-xs text-muted-foreground text-center">
          Väntar på att piffaren bekräftar överlämning…
        </p>
      )}
    </div>
  );
}
