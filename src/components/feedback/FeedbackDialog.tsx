import { useState } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { X, Loader2, Camera } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { cn } from "@/lib/utils";

type FeedbackMode = "issue" | "feedback";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  const [mode, setMode] = useState<FeedbackMode>("issue");
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode("issue");
    setText("");
    setScreenshot(null);
    setCapturing(false);
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) reset();
    onOpenChange(next);
  };

  const handleCapture = async () => {
    setCapturing(true);
    try {
      // Hide the dialog visually while capturing so it isn't in the shot.
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (el) =>
          el instanceof HTMLElement &&
          (el.closest("[data-feedback-dialog]") !== null ||
           el.closest("[data-radix-dialog-overlay]") !== null),
      });
      const dataUrl = canvas.toDataURL("image/png");
      setScreenshot(dataUrl);
    } catch (err) {
      console.warn("html2canvas failed", err);
      toast({
        title: t("interactions.feedback.capture_failed"),
        variant: "destructive",
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Fetch sender info (best-effort, not blocking)
      let senderName = "";
      let senderEmail = "";
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name,last_name")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            const p = profile as {
              first_name?: string | null;
              last_name?: string | null;
            };
            senderName =
              [p.first_name, p.last_name].filter(Boolean).join(" ") || "";
            senderEmail = user.email || "";
          } else {
            senderEmail = user.email || "";
          }
        } catch {
          senderEmail = user.email || "";
        }
      }

      const screenshotBase64 = screenshot
        ? screenshot.replace(/^data:image\/png;base64,/, "")
        : undefined;

      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          feedback_text: text.trim(),
          feedback_type: mode,
          sender_name: senderName,
          sender_email: senderEmail,
          screenshot_base64: screenshotBase64,
        },
      });

      if (error) throw error;

      toast({
        title: t("interactions.feedback.success_title"),
        description: t("interactions.feedback.success_description"),
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("send-feedback failed", err);
      toast({
        title: t("interactions.feedback.error_title"),
        description: t("interactions.feedback.error_description"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const placeholder =
    mode === "issue"
      ? t("interactions.feedback.placeholder_issue")
      : t("interactions.feedback.placeholder_feedback");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-feedback-dialog
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{t("interactions.feedback.dialog_title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("interactions.feedback.dialog_title")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("issue")}
            className={cn(
              "min-h-[48px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              mode === "issue"
                ? "border-primary bg-primary text-white"
                : "border-input bg-background hover:bg-accent",
            )}
          >
            {t("interactions.feedback.mode_issue")}
          </button>
          <button
            type="button"
            onClick={() => setMode("feedback")}
            className={cn(
              "min-h-[48px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              mode === "feedback"
                ? "border-primary bg-primary text-white"
                : "border-input bg-background hover:bg-accent",
            )}
          >
            {t("interactions.feedback.mode_feedback")}
          </button>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px]"
          maxLength={8000}
        />

        <div className="space-y-2">
          {screenshot ? (
            <div className="flex items-start gap-3 rounded-md border border-input p-2">
              <img
                src={screenshot}
                alt="Screenshot preview"
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">
                  {t("interactions.feedback.screenshot_attached")}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScreenshot(null)}
                aria-label={t("interactions.feedback.remove_screenshot")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCapture}
                disabled={capturing}
                className="w-full"
              >
                {capturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {t("interactions.feedback.capture_button")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("interactions.feedback.capture_hint")}
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            {t("interactions.feedback.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("interactions.feedback.sending")}
              </>
            ) : (
              t("interactions.feedback.submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
