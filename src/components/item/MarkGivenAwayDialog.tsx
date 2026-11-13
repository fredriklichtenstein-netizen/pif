import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearPostsCache } from "@/services/posts/optimized";
import { useToast } from "@/hooks/use-toast";

interface MarkGivenAwayDialogProps {
  itemId: string | number;
  itemTitle?: string;
  isWish: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * "Markera som piffad / uppfylld": the owner completes a pif or wish that
 * was given away (or fulfilled) outside the app, with no receiver.
 * mark_item_given_away() closes any open conversations with a note.
 */
export function MarkGivenAwayDialog({ itemId, itemTitle, isWish, isOpen, onClose, onSuccess }: MarkGivenAwayDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const kind = isWish ? "wish" : "pif";

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const numericId = typeof itemId === "number" ? itemId : parseInt(String(itemId), 10);
      const { error } = await (supabase as any).rpc("mark_item_given_away", { p_item_id: numericId });
      if (error) throw error;
      try {
        clearPostsCache();
        queryClient.removeQueries({ queryKey: ["posts", "optimized"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } catch (e) {
        console.error("feed cache invalidation failed", e);
      }
      toast({ title: t(`ui.mark_given_away_done_${kind}`) });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error("mark_item_given_away failed", err);
      toast({ title: t("ui.mark_given_away_failed"), description: err?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`ui.mark_given_away_${kind}_title`)}</DialogTitle>
          <DialogDescription>
            {t(`ui.mark_given_away_${kind}_description`, { title: itemTitle ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t(`ui.mark_given_away_confirm_${kind}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
