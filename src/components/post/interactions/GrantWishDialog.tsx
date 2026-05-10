import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface GrantWishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the trimmed note when the helper confirms. */
  onConfirm: (note: string) => void | Promise<void>;
  /** Optional context — wish title shown in the description. */
  wishTitle?: string;
  /** Disable the confirm button while the parent persists. */
  submitting?: boolean;
}

const MIN_NOTE = 4;
const MAX_NOTE = 500;

/**
 * Dialog shown when a neighbor wants to help grant a wish.
 *
 * Mirrors the "interest" intent on a pif but reframed for the wish
 * flow: the helper writes a short note explaining HOW they can grant
 * the wish. The note is persisted on the interest row and used to
 * pre-seed the first message when the wisher chooses them.
 */
export function GrantWishDialog({
  open,
  onOpenChange,
  onConfirm,
  wishTitle,
  submitting = false,
}: GrantWishDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const trimmed = note.trim();
  const isValid = trimmed.length >= MIN_NOTE && trimmed.length <= MAX_NOTE;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    await onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {t("interactions.grant_wish_title", "Grant this wish")}
          </DialogTitle>
          <DialogDescription>
            {wishTitle
              ? t("interactions.grant_wish_description_with_title", {
                  defaultValue:
                    "Let {{name}} know how you can help with “{{title}}”. A short, kind note goes a long way.",
                  name: t("interactions.grant_wish_the_wisher", "the wisher"),
                  title: wishTitle,
                })
              : t(
                  "interactions.grant_wish_description",
                  "Tell the wisher how you can help. A short, kind note goes a long way."
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="grant-wish-note"
            className="text-sm font-medium text-foreground"
          >
            {t("interactions.grant_wish_note_label", "How can you help?")}
            <span className="text-destructive ml-0.5" aria-hidden>
              *
            </span>
          </label>
          <Textarea
            id="grant-wish-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
            placeholder={t(
              "interactions.grant_wish_note_placeholder",
              "e.g. I have one in great condition I no longer need — happy to drop it off this weekend."
            )}
            rows={5}
            autoFocus
            disabled={submitting}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {trimmed.length < MIN_NOTE
                ? t(
                    "interactions.grant_wish_note_min",
                    "Please add at least a sentence."
                  )
                : ""}
            </span>
            <span>
              {trimmed.length}/{MAX_NOTE}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("interactions.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="bg-amber-500 hover:bg-amber-500/90 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {submitting
              ? t("interactions.grant_wish_submitting", "Sending…")
              : t("interactions.grant_wish_confirm", "Offer to grant")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
