import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/hooks/auth/authStore";
import { useBlockStore } from "@/stores/blockStore";

/**
 * Mounted once in App. Loads who is hidden for the signed-in user, and shows
 * the "block this person?" confirmation that any menu can ask for with
 * useBlockStore.getState().requestBlock(...). A dialog rendered inside a
 * dropdown menu would unmount together with the menu, hence one shared host.
 */
export function BlockUserDialogHost() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const pending = useBlockStore((s) => s.pending);
  const cancel = useBlockStore((s) => s.cancelRequest);
  const block = useBlockStore((s) => s.block);
  const load = useBlockStore((s) => s.load);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load(userId);
  }, [userId, load]);

  const name = pending?.name?.trim() || t("blocking.this_person");

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await block(pending.id);
      toast.success(t("blocking.blocked_toast", { name }));
      cancel();
    } catch (e) {
      console.error("[blocks] block failed", e);
      toast.error(t("blocking.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open && !busy) cancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("blocking.confirm_title", { name })}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t("blocking.confirm_body_1", { name })}</p>
              <p>{t("blocking.confirm_body_2")}</p>
              <p>{t("blocking.confirm_body_3")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("blocking.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => { e.preventDefault(); void confirm(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("blocking.confirm_button")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
