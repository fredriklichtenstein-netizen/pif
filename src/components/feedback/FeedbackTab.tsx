import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Loader2, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { resolveDisplayName } from "@/utils/displayName";
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

  // Mobile landscape (short height, e.g. a phone rotated) needs a different
  // layout than tall portrait/desktop: the right-edge flyout used everywhere
  // else is width-capped at 360px and height-bounded by top-4/bottom-40, so
  // on a viewport that's wide but short it renders as a narrow column
  // squeezed into a corner with most of its content only reachable by
  // scrolling -- it never uses the extra width landscape actually offers.
  // 500px is comfortably above real phone landscape heights (iPhone: ~375-
  // 430px) and below real desktop/tablet landscape heights, so this doesn't
  // affect the desktop flyout, which works fine as-is.
  const [mobileLandscape, setMobileLandscape] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const update = () => setMobileLandscape(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const reset = () => {
    setMode("issue");
    setText("");
    setScreenshot(null);
    setCapturing(false);
    setSubmitting(false);
  };

  // Trello B15: this used to call reset() unconditionally, so dismissing
  // the panel for ANY reason -- the X button, tapping outside, Escape --
  // silently wiped whatever the user had typed. Reopening then showed an
  // empty form with no indication the draft was ever lost. close() now
  // only hides the panel; the draft (text/mode/screenshot) survives until
  // either a successful submit (see handleSubmit) or the tab is actually
  // reopened and cleared some other way. There's no separate "discard
  // draft" affordance yet -- out of scope for this fix, which is just
  // about not losing a draft the user never asked to discard.
  const close = () => {
    if (submitting) return;
    setOpen(false);
  };

  // Close on outside click or Escape, matching the expected behavior of a
  // flyout panel without a modal backdrop.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      // closest(), not panelRef.contains(): the mobile-landscape layout
      // renders the trigger button and the panel as separate fixed-position
      // siblings (not nested), so a single ref can't cover both -- every
      // element that's part of the widget carries data-feedback-panel.
      if (!(e.target as HTMLElement).closest("[data-feedback-panel]")) {
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
      // x/y/width/height constrain html2canvas to exactly the current
      // viewport. Without them it defaults to the full SCROLLABLE height
      // of document.body -- reported live: the resulting screenshot
      // included far more than what was actually on screen, and was
      // visually distorted (a fixed-position element -- MainNav's pill --
      // appeared duplicated/misplaced partway down the image). Both match
      // a documented html2canvas issue: capturing content taller than one
      // viewport clones the DOM into an off-screen render and can
      // duplicate/mislocate position:fixed elements at each "page" of
      // that clone. Capturing only the actual viewport avoids the
      // multi-page clone entirely, since there's exactly one viewport's
      // worth of content to render.
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
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
      // Fetch sender info (best-effort, not blocking). Uses the same
      // resolveDisplayName the rest of the app uses (messages, nav) --
      // this used to be a narrower inline first_name+last_name-only join
      // with no username fallback and no username even in the SELECT, so
      // any user without both names filled in showed as "Anonym" here
      // even when they had an identifiable username.
      let senderName = "";
      let senderEmail = "";
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name,last_name,username")
            .eq("id", user.id)
            .maybeSingle();
          senderName = resolveDisplayName(profile as any, "");
          senderEmail = user.email || "";
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
      // Unlike close(), a successful send DOES clear the draft -- there's
      // nothing left worth keeping once it's actually been sent.
      setOpen(false);
      reset();
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

  const modeToggle = (
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
  );

  const screenshotArea = (
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
  );

  const footerActions = (
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
  );

  // Mobile landscape: a centered dialog that spans the available width
  // instead of the edge-anchored flyout below. Two side-by-side columns
  // (mode + text on the left, screenshot on the right) mean the form fits
  // without the scrolling the cramped single-column version needed on a
  // short viewport. The trigger tab is a separate fixed element (not nested
  // in the dialog) so it stays reachable while the dialog is closed, offset
  // by env(safe-area-inset-right) so it doesn't sit behind the sensor-
  // housing cutout when the phone is rotated with the camera on that edge.
  if (mobileLandscape) {
    return (
      <>
        <button
          type="button"
          data-feedback-panel
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={t("interactions.feedback.fab_aria")}
          style={{ right: "env(safe-area-inset-right)" }}
          className="fixed top-1/2 z-40 flex w-9 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-l-md bg-primary py-4 text-white shadow-lg transition-colors hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-medium tracking-wide [writing-mode:vertical-rl] rotate-180">
            {t("interactions.feedback.tab_label")}
          </span>
        </button>

        {open && (
          // z-[60]: above MainNav's z-50. Unlike the edge-anchored flyout
          // below (which intentionally stays under the nav since it never
          // covers it), this is a full-screen backdrop meant to block
          // interaction with the rest of the app while open -- at z-40 the
          // nav pill would render on top of it and stay tappable through
          // the "modal".
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">
            <div
              ref={panelRef}
              data-feedback-panel
              className="flex max-h-full w-full max-w-2xl flex-col overflow-y-auto rounded-xl bg-background p-4 shadow-lg ring-1 ring-black/10"
            >
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

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  {modeToggle}
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[90px] flex-1 resize-none"
                    maxLength={8000}
                  />
                </div>
                {screenshotArea}
              </div>

              <div className="pt-3">{footerActions}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      data-feedback-panel
      // Trello: "Feedback button/component does not appear properly on
      // mobile landscape screen." Root cause: this used to be
      // `bottom-40 right-0` with only `bottom` set, so per CSS fixed-
      // positioning rules the container had no height ceiling -- it grew
      // upward from the 160px-from-bottom anchor to whatever height the
      // open form needed (~450-500px: textarea + mode buttons + screenshot
      // row + submit row), unconstrained by the actual viewport. On a
      // short landscape phone viewport (often well under 400px tall) that
      // pushed most of the form above y=0 with no way to scroll it into
      // view -- not "missing", just rendered off-screen.
      // Setting BOTH `top-4` and `bottom-40` gives the container a real,
      // bounded computed height (100dvh - 1rem - 10rem) that percentage
      // heights below can resolve against. `items-end` keeps children
      // flush against the bottom of that box, so on any normal (tall)
      // viewport this is visually identical to the old bottom-anchored
      // position -- the bound only ever kicks in when there truly isn't
      // room, at which point the panel scrolls internally (see below)
      // instead of spilling off-screen.
      // The really cramped landscape case (short height) is now handled
      // above by mobileLandscape instead -- this bound is a fallback for
      // any other narrow-but-not-quite-mobileLandscape viewport.
      style={{ right: "env(safe-area-inset-right)" }}
      className="fixed top-4 bottom-40 z-40 flex items-end"
    >
      <div
        className={cn(
          // overflow-x-hidden (not overflow-hidden) so the width
          // transition still clips horizontally, but overflow-y-auto lets
          // content taller than the bounded container scroll internally
          // instead of being invisibly cut off or spilling past `top-4`.
          "overflow-x-hidden overflow-y-auto max-h-full rounded-l-xl bg-background transition-[width] duration-300 ease-out",
          open
            ? "w-[min(360px,calc(100vw-3.5rem))] shadow-lg ring-1 ring-black/5"
            : "w-0",
        )}
      >
        {/* h-full dropped: the content needs its natural (intrinsic)
            height so it can exceed the scroll container's max-h-full and
            actually trigger the scrollbar above, rather than being
            squashed to fit. */}
        <div className="flex w-[min(360px,calc(100vw-3.5rem))] flex-col gap-3 p-4">
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

          {modeToggle}

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px]"
            maxLength={8000}
          />

          {screenshotArea}
          {footerActions}
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
