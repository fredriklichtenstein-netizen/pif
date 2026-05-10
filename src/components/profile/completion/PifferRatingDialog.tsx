import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { submitRating, type RatingOutcome } from "@/services/ratings";

interface PifferRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | number;
  receiverName: string;
  /**
   * When provided, this is a wish-helper rating: the dialog rates a
   * specific helper and routes to submit_helper_rating instead of the
   * single-receiver submit_rating RPC.
   */
  helperId?: string;
  /** Demo Mode only */
  demoRaterId?: string;
  demoRateeId?: string;
  onSubmitted?: () => void;
}

/**
 * Shown to the piffer right after they mark a pif as piffed, and to the
 * wisher when they mark an individual helper as having granted their
 * wish. Captures positive vs no-show outcome on a single counter-party.
 * Skipping is allowed — no rating is recorded in that case.
 */
export function PifferRatingDialog({
  open,
  onOpenChange,
  itemId,
  receiverName,
  helperId,
  demoRaterId,
  demoRateeId,
  onSubmitted,
}: PifferRatingDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<RatingOutcome | null>(null);
  const isHelper = !!helperId;

  const handleRate = async (outcome: RatingOutcome) => {
    setSubmitting(outcome);
    const res = await submitRating({
      itemId,
      outcome,
      helperId,
      demoRaterId,
      demoRateeId: demoRateeId ?? helperId,
    });
    setSubmitting(null);

    if (!res.ok) {
      toast({
        title: t("interactions.rating_failed_title"),
        description: t("interactions.rating_failed_description"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("interactions.rating_thanks_title"),
      description:
        outcome === "positive"
          ? t("interactions.rating_thanks_positive")
          : t("interactions.rating_thanks_no_show"),
    });
    onOpenChange(false);
    onSubmitted?.();
  };

  const handleSkip = () => {
    // Skipping is logged at the call-site; no rating row is created.
    console.warn("piffer_rating_skipped", { itemId });
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("interactions.rate_receiver_title", { name: receiverName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("interactions.rate_receiver_description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3 py-2">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 border-green-200 hover:bg-green-50"
            disabled={submitting !== null}
            onClick={() => handleRate("positive")}
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="text-left">
              <div className="font-medium text-foreground">
                {t("interactions.rate_positive_label")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("interactions.rate_positive_hint")}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-3 border-amber-200 hover:bg-amber-50"
            disabled={submitting !== null}
            onClick={() => handleRate("no_show")}
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-left">
              <div className="font-medium text-foreground">
                {t("interactions.rate_no_show_label")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("interactions.rate_no_show_hint")}
              </div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={submitting !== null}
          >
            {t("interactions.rate_skip")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
