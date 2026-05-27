import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useCachedProfile } from "@/hooks/profile/useCachedProfile";

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | number;
}

export function ReportPostDialog({ open, onOpenChange, itemId }: ReportPostDialogProps) {
  const { t } = useTranslation();
  const { session } = useGlobalAuth();
  const userId = session?.user?.id;
  const profile = useCachedProfile(userId);
  const [reason, setReason] = useState<string>("");
  const [reasonText, setReasonText] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Stable canonical keys + localized labels. The canonical key is what gets
  // stored / emailed so it stays consistent across languages.
  const reasons = useMemo(
    () => [
      { key: "inappropriate", label: t("interactions.report_post_reason_inappropriate") },
      { key: "spam", label: t("interactions.report_post_reason_spam") },
      { key: "misleading", label: t("interactions.report_post_reason_misleading") },
      { key: "harassment", label: t("interactions.report_post_reason_harassment") },
      { key: "other", label: t("interactions.report_post_reason_other") },
    ],
    [t],
  );

  useEffect(() => {
    if (open) {
      setReason("");
      setReasonText("");
      setComments("");
      setSubmitting(false);
    }
  }, [open]);

  const displayName =
    (profile as any)?.full_name ||
    [(profile as any)?.first_name, (profile as any)?.last_name].filter(Boolean).join(" ") ||
    session?.user?.email ||
    "";
  const avatarUrl =
    (profile as any)?.avatar_url || (profile as any)?.profile_picture_url || undefined;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  const canSubmit =
    !!reason && (reason !== "other" || reasonText.trim().length > 0) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Hard safety timeout so the dialog can never get stuck on "Skickar…"
    // even if the network/edge function hangs.
    const timeout = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(
        () => resolve({ error: { message: "Request timed out" } }),
        15000,
      ),
    );
    try {
      const selected = reasons.find((r) => r.key === reason);
      const result = (await Promise.race([
        supabase.functions.invoke("send-report", {
          body: {
            itemId: String(itemId),
            reason: selected?.label ?? reason,
            reasonText: reason === "other" ? reasonText.trim() : null,
            comments: comments.trim() || null,
          },
        }),
        timeout,
      ])) as { error?: { message?: string } | null };
      if (result?.error) throw new Error(result.error.message || "Failed");
      toast.success(t("interactions.report_post_success"));
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to submit report", e);
      toast.error(t("interactions.report_post_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-semibold">{t("interactions.report_post_title")}</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("interactions.report_post_close_aria")}
            className="rounded-full p-1 hover:bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Reporter identity */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Avatar className="h-10 w-10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {t("interactions.report_post_identity")}
              </p>
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("interactions.report_post_reason_label")}
            </Label>
            <div className="space-y-2">
              {reasons.map((r) => {
                const selected = reason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setReason(r.key)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:bg-muted/50"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span>{r.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* "Other" free text */}
          {reason === "other" && (
            <div className="space-y-1.5">
              <Label htmlFor="report-reason-text" className="text-sm font-medium">
                {t("interactions.report_post_other_label")}
              </Label>
              <Textarea
                id="report-reason-text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={t("interactions.report_post_other_placeholder")}
                rows={3}
                maxLength={2000}
              />
            </div>
          )}

          {/* Additional comments */}
          <div className="space-y-1.5">
            <Label htmlFor="report-comments" className="text-sm font-medium">
              {t("interactions.report_post_comments_label")}
            </Label>
            <Textarea
              id="report-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t("interactions.report_post_comments_placeholder")}
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("interactions.report_post_cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting
                ? t("interactions.report_post_submitting")
                : t("interactions.report_post_submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
