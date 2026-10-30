import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Loader2, Camera, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { resolveDisplayName } from "@/utils/displayName";
import { cn } from "@/lib/utils";

type FeedbackMode = "issue" | "feedback";

interface FeedbackImage {
  id: string;
  kind: "screenshot" | "upload";
  dataUrl: string;
  filename: string;
}

/** Matches send-feedback's MAX_ATTACHMENTS. */
const MAX_IMAGES = 3;
/** html2canvas can't be cancelled, but we stop waiting for it after this. */
const CAPTURE_TIMEOUT_MS = 12_000;
/** Attached photos are downsized to this longest side before sending. */
const UPLOAD_MAX_DIMENSION = 1600;

/** Re-encodes a picked photo as a reasonably sized JPEG data URL. */
async function fileToJpegDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    bitmap.close();
  }
}

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
  const [images, setImages] = useState<FeedbackImage[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setImages([]);
    setCapturing(false);
    setAttaching(false);
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
    if (images.length >= MAX_IMAGES) return;
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
      //
      // The capture used to hang ("stuck loading"): html2canvas still
      // clones and waits on EVERY element of the page, including each
      // off-screen feed image (lazy ones never load in the clone, and each
      // waits out imageTimeout -- 15 s by default), at full device pixel
      // ratio. Now off-screen elements are skipped, image waits are capped,
      // it renders at scale 1 (also keeps the email attachment small), and
      // we give up after CAPTURE_TIMEOUT_MS instead of spinning forever.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isOffscreen = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return false;
        return r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw;
      };
      // Maps are WebGL canvases; html2canvas can only copy them because
      // they're created with preserveDrawingBuffer: true.
      const capture = html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scale: 1,
        imageTimeout: 4000,
        x: window.scrollX,
        y: window.scrollY,
        width: vw,
        height: vh,
        ignoreElements: (el) =>
          (el instanceof HTMLElement && el.closest("[data-feedback-panel]") !== null) ||
          isOffscreen(el),
      });
      const canvas = await Promise.race([
        capture,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Screenshot timed out")), CAPTURE_TIMEOUT_MS),
        ),
      ]);
      const dataUrl = canvas.toDataURL("image/png");
      setImages((prev) =>
        prev.length >= MAX_IMAGES
          ? prev
          : [...prev, { id: crypto.randomUUID(), kind: "screenshot", dataUrl, filename: `skarmbild-${prev.length + 1}.png` }],
      );
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

  const handleAttach = async (files: FileList | null) => {
    if (!files?.length) return;
    setAttaching(true);
    try {
      const room = MAX_IMAGES - images.length;
      const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (picked.length > room) {
        toast({ title: t("interactions.feedback.images_limit", { max: MAX_IMAGES }) });
      }
      const added: FeedbackImage[] = [];
      for (const file of picked.slice(0, Math.max(0, room))) {
        try {
          added.push({
            id: crypto.randomUUID(),
            kind: "upload",
            dataUrl: await fileToJpegDataUrl(file),
            filename: "",
          });
        } catch (err) {
          console.warn("Could not read attached image", err);
          toast({ title: t("interactions.feedback.attach_failed"), variant: "destructive" });
        }
      }
      setImages((prev) =>
        [...prev, ...added].slice(0, MAX_IMAGES).map((img, i) =>
          img.kind === "upload" ? { ...img, filename: `bild-${i + 1}.jpg` } : img,
        ),
      );
    } finally {
      setAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      const attachments = images.map((img) => ({
        filename: img.filename,
        content: img.dataUrl.replace(/^data:image\/[a-z]+;base64,/, ""),
      }));

      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          feedback_text: text.trim(),
          feedback_type: mode,
          sender_name: senderName,
          sender_email: senderEmail,
          attachments,
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

  const busy = capturing || attaching;
  const full = images.length >= MAX_IMAGES;
  const screenshotArea = (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <img
                src={img.dataUrl}
                alt={
                  img.kind === "screenshot"
                    ? t("interactions.feedback.screenshot_attached")
                    : t("interactions.feedback.image_attached")
                }
                className="h-16 w-16 rounded border border-input object-cover"
              />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                aria-label={t("interactions.feedback.remove_image")}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={handleCapture} disabled={busy || full}>
          {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {t("interactions.feedback.capture_button")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || full}
        >
          {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {t("interactions.feedback.attach_button")}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleAttach(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        {full
          ? t("interactions.feedback.images_limit", { max: MAX_IMAGES })
          : t("interactions.feedback.capture_hint")}
      </p>
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
