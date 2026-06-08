import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment?: string) => Promise<{ ok: boolean }>;
  onLowRatingReport: () => void;
}

/**
 * Piffer-facing rating modal. Submits via complete_pif_with_rating RPC.
 * A low rating (<=2) surfaces a follow-up nudge to file a formal report.
 */
export function PifRatingModal({
  open,
  onOpenChange,
  onSubmit,
  onLowRatingReport,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [askReport, setAskReport] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setHover(0);
      setComment("");
      setAskReport(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    const res = await onSubmit(rating, comment.trim() || undefined);
    setSubmitting(false);
    if (!res.ok) return;
    if (rating <= 2) {
      setAskReport(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {!askReport ? (
          <>
            <DialogHeader>
              <DialogTitle>Betygsätt mottagaren</DialogTitle>
              <DialogDescription>
                Ditt omdöme hjälper grannar att lita på varandra.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center gap-1 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} stjärnor`}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      n <= (hover || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              rows={3}
              placeholder="Lämna en kommentar (visas för mottagaren)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Hoppa över
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Skicka betyg
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Vill du rapportera problem med detta utbyte?</DialogTitle>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Nej tack
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onLowRatingReport();
                }}
              >
                Ja, rapportera
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
