import { useState } from "react";
import { Clock, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AwaitingConfirmationPopoverProps {
  /** 'offer' = pif (piffer + receiver), 'request' = wish (wisher + helper). */
  itemType: "offer" | "request";
  /** Whether the counter-party has confirmed receipt (drives the headline). */
  receiverConfirmed: boolean;
  /** Hard-complete: opens the rating dialog without waiting for the receiver. */
  onHardComplete?: () => void;
  /** Optional undo of the owner's own handoff confirmation. */
  onUndo?: () => Promise<unknown> | unknown;
}

/**
 * Inline pill + popover shown on a feed/profile card after the OWNER
 * (piffer or wisher) has confirmed handoff but the receiver/helper has
 * not yet confirmed receipt. Mirrors the messaging-side waiting state so
 * the card itself stops feeling silent after the user clicks
 * "Markera som uppfylld". Shared between pifs (offers) and wishes
 * (requests) — copy varies only by item type.
 */
export function AwaitingConfirmationPopover({
  itemType,
  receiverConfirmed,
  onHardComplete,
  onUndo,
}: AwaitingConfirmationPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const isWish = itemType === "request";

  const triggerLabel = receiverConfirmed
    ? t("interactions.awaiting_both_confirmed", "Genomför pifen")
    : t("interactions.awaiting_pill", "Väntar på bekräftelse");

  const headline = isWish
    ? t(
        "interactions.awaiting_headline_wish",
        "Du har bekräftat att önskan är uppfylld",
      )
    : t(
        "interactions.awaiting_headline_pif",
        "Du har bekräftat överlämning",
      );

  const subline = receiverConfirmed
    ? isWish
      ? t(
          "interactions.awaiting_sub_both_confirmed_wish",
          "Hjälparen har redan bekräftat. Slutför genom att lämna ett omdöme.",
        )
      : t(
          "interactions.awaiting_sub_both_confirmed_pif",
          "Mottagaren har redan bekräftat. Slutför genom att lämna ett omdöme.",
        )
    : isWish
      ? t(
          "interactions.awaiting_sub_wish",
          "Väntar på att hjälparen bekräftar att önskan är uppfylld.",
        )
      : t(
          "interactions.awaiting_sub_pif",
          "Väntar på att mottagaren bekräftar mottagning.",
        );

  const handleUndo = async () => {
    if (!onUndo) return;
    setUndoing(true);
    try {
      await onUndo();
      setOpen(false);
    } finally {
      setUndoing(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 ml-auto text-amber-700 border-amber-200 hover:bg-amber-50"
        >
          {receiverConfirmed ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{headline}</p>
          <p className="text-xs text-muted-foreground">{subline}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setOpen(false);
              onHardComplete();
            }}
          >
            {receiverConfirmed
              ? t("interactions.awaiting_finish_btn", "Slutför och betygsätt")
              : t(
                  "interactions.awaiting_hard_complete_btn",
                  "Markera som klar ändå",
                )}
          </Button>
          {onUndo && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={undoing}
              onClick={handleUndo}
              className="text-muted-foreground"
            >
              {undoing ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : null}
              {t("interactions.awaiting_undo_btn", "Ångra bekräftelse")}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
