import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Loader2, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { cn } from "@/lib/utils";

type FeedbackMode = "issue" | "feedback";

/**
 * Global feedback entry point. Mounted once at the App root.
 *
 * A narrow vertical tab sits flush against the right edge of the screen and
 * smoothly expands leftward into the full form when tapped, instead of
 * opening a centered modal. bottom-40 keeps the same Y anchor the previous
 * floating button used -- clear of both the bottom MainNav pill and the
 * bottom-right form CTAs ("Nästa", "Slutför", "Publicera") on form pages.
 * z-40 keeps it below the nav (z-50) so nav taps always win if they overlap.
 */
export function FeedbackTab() {
  const { user } = useGlobalAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
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

  const close = () => {
    if (submitting) return;
    setOpen(false);
    reset();
  };

  // Close on outside click or Escape, matching the expected behavior of a
  // flyout panel without a modal backdrop.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting]);

  const handleCapture = async () => {
    setCapturing(true);
    try {
      // Hide the panel visually while capturing so it isn't in the shot.
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (el) =>
          el instanceof HTMLElement && el.closest("[data-feedback-panel]") !== null,
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
      close();
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

  if (!user) return null;

  const placeholder =
    mode === "issue"
      ? t("interactions.feedback.placeholder_issue")
      : t("interactions.feedback.placeholder_feedback");

  return (
    <div
      ref={panelRef}
      data-feedback-panel
      className="fixed bottom-40 right-0 z-40 flex items-stretch"
    >
      <div
        className={cn(
          "overflow-hidden rounded-l-xl bg-background shadow-lg ring-1 ring-black/5 transition-[width] duration-300 ease-out",
          open ? "w-[min(360px,calc(100vw-3.5rem))]" : "w-0",
        )}
      >
        <div className="flex h-full w-[min(360px,calc(100vw-3.5rem))] flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {t("interactions.feedback.dialog_title")}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label={t("interactions.feedback.cancel")}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("issue")}
              className={cn(
                "min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
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
                "min-h-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors",
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
            className="min-h-[120px]"
            maxLength={8000}
          />

          <div className="space-y-2">
            {screenshot ? (
              <div className="flex items-start gap-3 rounded-md border border-input p-2">
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  className="h-16 w-16 rounded object-cover"
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

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>
              {t("interactions.feedback.cancel")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!text.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("interactions.feedback.sending")}
                </>
              ) : (
                t("interactions.feedback.submit")
              )}
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t("interactions.feedback.fab_aria")}
        className="flex w-9 flex-col items-center justify-center gap-2 rounded-l-md bg-primary py-4 text-white shadow-lg transition-colors hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span className="text-xs font-medium tracking-wide [writing-mode:vertical-rl] rotate-180">
          {t("interactions.feedback.tab_label")}
        </span>
      </button>
    </div>
  );
}
