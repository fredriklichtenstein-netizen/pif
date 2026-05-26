import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

const REASONS = [
  "Olämpligt innehåll",
  "Spam",
  "Felaktig information",
  "Trakasserier",
  "Annat",
] as const;

export function ReportPostDialog({ open, onOpenChange, itemId }: ReportPostDialogProps) {
  const { session } = useGlobalAuth();
  const userId = session?.user?.id;
  const profile = useCachedProfile(userId);
  const [reason, setReason] = useState<string>("");
  const [reasonText, setReasonText] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    "Du";
  const avatarUrl = (profile as any)?.avatar_url || (profile as any)?.profile_picture_url || undefined;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  const canSubmit =
    !!reason && (reason !== "Annat" || reasonText.trim().length > 0) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-report", {
        body: {
          itemId: String(itemId),
          reason,
          reasonText: reason === "Annat" ? reasonText.trim() : null,
          comments: comments.trim() || null,
        },
      });
      if (error) throw error;
      toast.success("Tack för din rapport. Vi granskar den inom kort.");
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to submit report", e);
      toast.error("Kunde inte skicka rapporten. Försök igen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        // Hide built-in close so we can render a custom one
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold">Rapportera inlägg</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Stäng"
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
              <p className="text-xs text-muted-foreground">Rapporten skickas i ditt namn</p>
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Anledning</Label>
            <div className="space-y-2">
              {REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
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
                      <span>{r}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* "Annat" free text */}
          {reason === "Annat" && (
            <div className="space-y-1.5">
              <Label htmlFor="report-reason-text" className="text-sm font-medium">
                Beskriv anledningen
              </Label>
              <Textarea
                id="report-reason-text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Berätta vad som är problemet…"
                rows={3}
                maxLength={2000}
              />
            </div>
          )}

          {/* Additional comments */}
          <div className="space-y-1.5">
            <Label htmlFor="report-comments" className="text-sm font-medium">
              Övriga kommentarer (valfritt)
            </Label>
            <Textarea
              id="report-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Lägg till mer information om du vill…"
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
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? "Skickar…" : "Rapportera"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
