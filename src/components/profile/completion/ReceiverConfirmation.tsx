
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDemoCompletionStore } from "@/stores/demoCompletionStore";
import { DEMO_MODE } from "@/config/demoMode";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ReceiverConfirmationProps {
  itemId: string | number;
  itemTitle: string;
  pifferName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: () => void;
}

export function ReceiverConfirmation({
  itemId,
  itemTitle,
  pifferName,
  open,
  onOpenChange,
  onConfirmed,
}: ReceiverConfirmationProps) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { confirmReceipt } = useDemoCompletionStore();
  const { t } = useTranslation();

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      if (DEMO_MODE) {
        confirmReceipt(itemId, feedback || undefined);
      } else {
        const { error: itemError } = await supabase
          .from("items")
          .update({ pif_status: "completed" })
          .eq("id", typeof itemId === "string" ? parseInt(itemId, 10) : itemId);

        if (itemError) throw itemError;

        if (feedback) {
        }
      }

      toast({
        title: t('interactions.confirmed_toast'),
        description: t('interactions.confirmed_description'),
      });

      onOpenChange(false);
      onConfirmed?.();
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast({
        title: t('post.error'),
        description: t('interactions.confirm_error'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            {t('interactions.confirm_receipt_title')}
          </DialogTitle>
          <DialogDescription>
            {t('interactions.confirm_receipt_description', { itemTitle, pifferName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              {t('interactions.confirm_trust_message')}
            </p>
          </div>

          {!showFeedback ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedback(true)}
              className="text-muted-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('interactions.add_feedback')}
            </Button>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('interactions.private_feedback_to', { name: pifferName })}
              </label>
              <Textarea
                placeholder={t('interactions.feedback_placeholder')}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                {t('interactions.feedback_private_note')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('interactions.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? t('interactions.confirming') : t('interactions.confirm_receipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
