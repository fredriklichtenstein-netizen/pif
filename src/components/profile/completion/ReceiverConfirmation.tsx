
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

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      if (DEMO_MODE) {
        confirmReceipt(itemId, feedback || undefined);
      } else {
        // Update item pif_status to completed
        const { error: itemError } = await supabase
          .from("items")
          .update({ pif_status: "completed" })
          .eq("id", typeof itemId === "string" ? parseInt(itemId, 10) : itemId);

        if (itemError) throw itemError;

        // Store feedback if provided
        if (feedback) {
          // Could store in a feedback table in the future
          console.log("Feedback for item", itemId, ":", feedback);
        }
      }

      toast({
        title: "Bekräftad!",
        description: "Tack för att du bekräftade mottagandet. Piffen är nu slutförd!",
      });

      onOpenChange(false);
      onConfirmed?.();
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast({
        title: "Fel",
        description: "Kunde inte bekräfta mottagandet. Försök igen.",
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
            Bekräfta mottagande
          </DialogTitle>
          <DialogDescription>
            Bekräfta att du har mottagit "{itemTitle}" från {pifferName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Genom att bekräfta hjälper du bygga förtroende i communityn och
              låter piffern veta att allt gick bra.
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
              Lägg till privat feedback (valfritt)
            </Button>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Privat feedback till {pifferName}
              </label>
              <Textarea
                placeholder="T.ex. 'Tack så mycket! Bokhyllan passar perfekt!'"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Denna feedback är endast synlig för piffern.
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
            Avbryt
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Bekräftar..." : "Bekräfta mottagande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
