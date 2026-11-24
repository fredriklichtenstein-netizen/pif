import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearPostsCache } from "@/services/posts/optimized";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/auth/authStore";
import { InterestSelectionList } from "@/components/post/interactions/interest/InterestSelectionList";

interface MarkGivenAwayDialogProps {
  itemId: string | number;
  itemTitle?: string;
  isWish: boolean;
  itemOwnerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * "Markera som piffad / uppfylld" from the post's ⋯ menu (Trello #132).
 *
 * Step 1: who got it? The post's interest list, where the owner chooses the
 * person and marks the handover -- the same confirm_pif_handoff as the chat,
 * so post and chat stay one handover. Step 2 (button "Piffad utanför appen"):
 * mark_item_given_away, for a pif given away outside the app; it closes open
 * conversations with a note. Step 2 is hidden once a handover with someone in
 * the app is confirmed, since it would tell that person it went elsewhere.
 */
export function MarkGivenAwayDialog({ itemId, itemTitle, isWish, itemOwnerId, isOpen, onClose, onSuccess }: MarkGivenAwayDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"choose" | "outside">("choose");
  const kind = isWish ? "wish" : "pif";
  // From the list's own completion state (one realtime subscription per post).
  const [handover, setHandover] = useState({ loading: true, pifferConfirmed: false });
  const onHandoverStateChange = useCallback(
    (next: { loading: boolean; pifferConfirmed: boolean }) => setHandover(next),
    [],
  );

  useEffect(() => {
    if (isOpen) setStep("choose");
  }, [isOpen]);

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
      <DialogContent
        className="max-w-md"
        onCloseAutoFocus={(e) => {
          // Opened from the post's ⋯ menu: when both close together Radix can
          // leave body `pointer-events: none` behind and the page "freezes"
          // until a reload (#133). Same cleanup as SimpleDeleteDialog.
          e.preventDefault();
          setTimeout(() => {
            if (!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) {
              document.body.style.pointerEvents = "";
            }
          }, 0);
        }}
      >
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>{t(`ui.mark_choose_${kind}_title`)}</DialogTitle>
              <DialogDescription>{t(`ui.mark_choose_${kind}_description`)}</DialogDescription>
            </DialogHeader>
            <div className="rounded-md border p-2">
              <InterestSelectionList
                itemId={itemId}
                itemOwnerId={itemOwnerId}
                currentUserId={currentUserId ?? undefined}
                itemType={isWish ? "request" : "offer"}
                setShowPopup={(show) => {
                  if (!show) onClose();
                }}
                onHandoverStateChange={onHandoverStateChange}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                {t("common.close", "Stäng")}
              </Button>
              {!handover.loading && !handover.pifferConfirmed && (
                <Button variant="secondary" onClick={() => setStep("outside")}>
                  {t(`ui.mark_outside_${kind}`)}
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t(`ui.mark_given_away_${kind}_title`)}</DialogTitle>
              <DialogDescription>
                {t(`ui.mark_given_away_${kind}_description`, { title: itemTitle ?? "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep("choose")} disabled={busy}>
                {t("common.back", "Tillbaka")}
              </Button>
              <Button onClick={handleConfirm} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t(`ui.mark_given_away_confirm_${kind}`)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
