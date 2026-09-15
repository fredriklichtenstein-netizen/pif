import { useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Crop as CropIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PostImageTrimDialogProps {
  image: string | null;
  progress: { current: number; total: number } | null;
  /** Rotates the underlying file (see useImageCropQueue) -- deliberately
   *  lives in THIS step, not the preview-frame step after it: straightening
   *  has to happen BEFORE trimming, or a trim rectangle picked on a still-
   *  sideways photo ends up applied to the wrong orientation once rotated. */
  onRotate: (direction: 1 | -1) => void;
  isRotating?: boolean;
  /** PERMANENTLY crops the file to the given rectangle (natural-image pixel
   *  coordinates, already scaled up from react-image-crop's displayed-size
   *  output). Confirmed via an AlertDialog first -- can't be undone. */
  onApply: (pixelCrop: { x: number; y: number; width: number; height: number }) => void;
  isApplying?: boolean;
  /** No trim wanted for this image -- move on to the preview-frame step
   *  as-is (any rotation already applied is kept; that's not staged). */
  onSkip: () => void;
  onCancel: () => void;
}

/** Round 9: react-image-crop's OWN minWidth/minHeight props were removed
 *  from <ReactCrop> below after confirming this is a known, unresolved,
 *  multi-report upstream bug (github.com/sekoyo/react-image-crop issues
 *  #61, #300, #554, #502) -- passing them makes getPointRegion() use a
 *  position-INDEPENDENT branch ("never flip") instead of comparing the
 *  live pointer position, which corrupts single-axis mid-edge resizing
 *  (confirmed live: north/west edges became undraggable while east/south
 *  kept working, matching this bug class exactly -- one report states
 *  plainly "the issue does not occur when minHeight and minWidth props
 *  are removed"). Enforced the same practical floor ourselves instead,
 *  in the Beskär button's disabled check below, which the library can't
 *  corrupt since it never touches the drag math. */
const MIN_CROP_SIZE_PX = 20;

/** Clamps a percent-unit crop so it can never extend past the image's own
 *  0-100 bounds, regardless of what a drag/resize gesture reported.
 *  react-image-crop is a CONTROLLED component here (crop driven by our own
 *  state), so clamping in the onChange handler is enough to constrain the
 *  rendered rectangle even if the library's raw output briefly overshoots
 *  during a drag -- confirmed live: without this, the box could be pulled
 *  outside the visible image, making precise edge placement hard. */
function clampPercentCrop(crop: Crop): Crop {
  const width = Math.min(crop.width, 100);
  const height = Math.min(crop.height, 100);
  const x = Math.max(0, Math.min(crop.x, 100 - width));
  const y = Math.max(0, Math.min(crop.y, 100 - height));
  return { ...crop, x, y, width, height };
}

/**
 * Trello C4 round 3/4: true freeform trim, split into its own step BEFORE
 * the existing square preview-frame picker (PostImageCropDialog) rather
 * than sharing one crop-rectangle selection between two different actions
 * -- confirmed via user testing that merging them was poor UX (forces a
 * square-shaped trim, and conflates "cut this permanently" with "frame the
 * thumbnail" as if they were the same choice).
 *
 * react-easy-crop (used by the preview-frame step and the avatar cropper)
 * can only zoom/pan within a FIXED aspect ratio -- it has no drag-resizable
 * rectangle, so it can't do genuine freeform trim. react-image-crop can,
 * so this step alone uses it; the preview-frame step is untouched and
 * still uses react-easy-crop for its square window.
 *
 * Interaction is deliberately edges-only: the crop box starts covering the
 * WHOLE image (clearly showing it's croppable, not requiring the user to
 * first figure out how to draw one), can't be dragged around as a block,
 * and can't be cleared entirely (`keepSelection`) -- confirmed via user
 * testing that letting the box be moved or lost entirely made precise
 * trimming needlessly fiddly. Only resizing from the edges/corners is
 * possible: pointer-events is disabled on `.ReactCrop__crop-selection`
 * (the whole-box move area) via the scoped CSS below, with it explicitly
 * re-enabled on `.ReactCrop__drag-handle`/`-bar` (the corner/edge resize
 * handles) since those turned out to be DESCENDANTS of crop-selection,
 * not siblings -- confirmed live: the first version of this disabled
 * resizing too, not just the move, since pointer-events inherits.
 */
export function PostImageTrimDialog({
  image,
  progress,
  onRotate,
  isRotating = false,
  onApply,
  isApplying = false,
  onSkip,
  onCancel,
}: PostImageTrimDialogProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const cropWrapperRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [trimConfirmOpen, setTrimConfirmOpen] = useState(false);

  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setTrimConfirmOpen(false);
  }, [image]);

  /** Round 11: rounds 8-10 fixed the handles' CSS visibility, the library's
   *  own resize math (minWidth/minHeight removal), and the dialog's own
   *  height/scroll -- all independently confirmed correct via a real
   *  headless-engine reproduction (exact positioning AND resize math both
   *  checked out, including the exact compound "drag left edge, then drag
   *  top edge" sequence from the user's own report). Yet the user's real
   *  iOS Safari device still couldn't drag the north/south handles, while
   *  east/west worked. The one thing no available tool can reproduce is
   *  WebKit's native touch-vs-scroll gesture arbitration, which runs on the
   *  compositor BEFORE any JS executes -- `touch-action: none` (set on
   *  these handles since round 6, both directly and via the library's own
   *  cascading rule on .ReactCrop__crop-selection) is the correct, spec-
   *  compliant way to opt out of that, but has a well-documented history of
   *  gaps specifically on iOS Safari for touch sequences that begin inside
   *  a nested/transformed layout (this Dialog is centered via `transform:
   *  translate(-50%,-50%)`, and round 10 just made it scrollable too,
   *  giving iOS's gesture recognizer a real competing vertical-scroll
   *  target to resolve toward -- east/west drags have no such competing
   *  gesture, which would explain the asymmetry even if touch-action is
   *  technically correct). The standard, widely-precedented workaround for
   *  this exact class of iOS bug (used by most touch-drag libraries) is a
   *  manually-attached, non-passive `touchstart` listener that force-calls
   *  preventDefault() -- CSS touch-action alone isn't always enough on iOS
   *  Safari, but JS can still win the race if attached in the capture phase
   *  before the browser commits to a scroll. React's own synthetic event
   *  system doesn't cover this (React defaults touchstart/touchmove to
   *  passive for perf, which would make preventDefault() a no-op), so this
   *  has to be a real addEventListener, not a JSX onTouchStart prop. */
  useEffect(() => {
    const wrapper = cropWrapperRef.current;
    if (!wrapper) return;

    const blockScrollOnHandle = (e: TouchEvent) => {
      const target = e.target;
      if (
        target instanceof Element &&
        (target.closest(".ReactCrop__drag-handle") || target.closest(".ReactCrop__drag-bar"))
      ) {
        e.preventDefault();
      }
    };

    wrapper.addEventListener("touchstart", blockScrollOnHandle, { capture: true, passive: false });
    return () => wrapper.removeEventListener("touchstart", blockScrollOnHandle, { capture: true } as EventListenerOptions);
  }, [image]);

  /** Seeds the crop box to cover the whole rendered image as soon as it
   *  loads, in both the percent form ReactCrop wants for its `crop` prop
   *  and the pixel form completedCrop needs -- without this, "Beskär"
   *  stays disabled and the box starts as nothing until the user first
   *  draws one from scratch. */
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    setCompletedCrop({ unit: 'px', x: 0, y: 0, width: img.width, height: img.height });
  };

  const handleTrimConfirm = () => {
    const img = imgRef.current;
    if (!completedCrop || !img || !completedCrop.width || !completedCrop.height) return;
    setTrimConfirmOpen(false);
    // react-image-crop's onComplete gives pixel coordinates in the
    // DISPLAYED (rendered) image size, not its natural resolution -- has
    // to be scaled up before it means anything to getCroppedImg, which
    // draws directly against the full-resolution source (same pattern
    // react-image-crop's own docs use).
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    onApply({
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    });
  };

  return (
    <>
      <Dialog
        open={!!image}
        onOpenChange={(open) => {
          // Defense in depth alongside onInteractOutside below: even if
          // some other signal fires onOpenChange(false) while the confirm
          // AlertDialog is opening (trimConfirmOpen already true by then --
          // setTrimConfirmOpen(true) commits synchronously in the same
          // click handler, before any async Radix dismiss signal could
          // fire), don't treat it as a real close.
          if (!open && !trimConfirmOpen) onCancel();
        }}
      >
        <DialogContent
          className="sm:max-w-[480px] max-h-90dvh overflow-y-auto"
          // Round 10: rounds 8/9 fixed the mid-edge handles' own CSS/JS and
          // both were confirmed byte-exact in the live bundle, yet the user
          // still couldn't reach the north/south handles on mobile -- while
          // east/west worked fine. That east/west-only-works asymmetry is
          // the tell: shadcn's base DialogContent (dialog.tsx) has no
          // max-height or scroll fallback at all -- it's `fixed ...
          // translate-x/y(-50%)`, sized purely by content. This dialog's
          // content stack (header text + rotate row + the crop wrapper's
          // fixed 392px + footer) can exceed a real mobile viewport's
          // height, and because the dialog is centered via translate(-50%),
          // any overflow pushes equally off BOTH the top and bottom of the
          // screen -- never left/right, since width is separately capped by
          // max-w-[480px] and never overflows. That cuts off exactly the
          // north/south handles (rendered at the very top/bottom of the
          // crop area) while east/west (positioned mid-height, within the
          // horizontally-centered and never-overflowing width) stay fully
          // reachable -- matching the report exactly, and explaining why it
          // took a genuinely tall/portrait image ("rectangle shaped") to
          // surface it: a landscape image renders shorter within the same
          // 392px budget, so its dialog is shorter overall and may never
          // hit this. Fixed the same way profile/PostModal.tsx already
          // handles a similarly tall dialog: cap height and let it scroll
          // instead of silently rendering off-screen. Uses the existing
          // dvh-utility pattern (see index.css's .max-h-70dvh comment on
          // why plain `vh` is unreliable on mobile) rather than the `vh`
          // PostModal itself uses, for the same reason.
          //
          // Round 6 (2nd pass): the guard above only covers the AlertDialog
          // OPENING (trimConfirmOpen is already false again by the time any
          // of ITS close paths -- Avbryt, Escape, outside-click, or even a
          // successful "Ja, beskär" -- resolve, since those all set
          // trimConfirmOpen(false) as part of closing). Adversarial review
          // confirmed that leaves this Dialog exposed to the same class of
          // spurious dismissal on the CLOSE transition too. Fix it at the
          // source instead of reacting after Radix has already decided:
          // Radix's AlertDialogContent renders with role="alertdialog", so
          // ignore any pointer-down/focus interaction that originates
          // inside one, regardless of which direction (open or close)
          // triggered it.
          onInteractOutside={(event) => {
            // instanceof guard, not just `?.`: Radix types event.target as
            // EventTarget | null (not Element), and an unchecked cast plus
            // single-level optional-chaining would still throw if target
            // were ever a non-Element EventTarget (e.g. Document) --
            // essentially never happens for a real pointerdown/focusin,
            // but costs nothing to rule out.
            const target = event.target;
            if (target instanceof Element && target.closest('[role="alertdialog"]')) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t("post.trim_step_title", { defaultValue: "Rotera och beskär (valfritt)" })}
              {progress && progress.total > 1 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({progress.current}/{progress.total})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {t("post.trim_step_description", {
                defaultValue:
                  "Räta upp bilden om den är sned, och dra i hörnen för att beskära den i valfritt format. Båda är permanenta ändringar. Hoppa över om du inte vill ändra bilden.",
              })}
            </DialogDescription>
          </DialogHeader>

          {image && (
            <div className="space-y-4">
              {/* p-8 (round 8, up from round 6's p-4): a user report
                  ("unable to pull the crop handles for rectangle shaped
                  image") plus a fresh adversarial pass found the round-6
                  buffer left only a ~2px safety margin on whichever axis
                  the image is bound (height via the <img>'s own max-h, or
                  width via max-w-full) -- worked out with real numbers for
                  several aspect ratios, that margin turned out to be
                  IDENTICAL regardless of image shape (not thinner for
                  rectangles specifically -- that part of the original
                  round-6 reasoning didn't hold up), but it's still a real,
                  needlessly thin margin that sub-pixel/DPR rounding could
                  plausibly eat into on some devices. Bumped to 32px per
                  side for real headroom (18px margin instead of 2px).
                  Deliberately did NOT grow the container's own
                  max-h-[392px] to compensate this time (round 6's
                  max-h-[360->392] approach): a second review flagged that
                  this dialog has no scroll fallback (plain shadcn
                  DialogContent), so a taller crop area risks pushing the
                  footer buttons off-screen on short viewports. Instead the
                  <img>'s own cap below is shrunk from 360 to 328
                  (392 - 2*32) so the TOTAL container height stays exactly
                  392px as before -- same dialog height, same net budget,
                  just reapportioned from image space to buffer space. */}
              <div
                ref={cropWrapperRef}
                className="pif-trim-crop flex items-center justify-center bg-muted rounded-md overflow-hidden max-h-[392px] p-8"
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(clampPercentCrop(percentCrop))}
                  onComplete={(c) => setCompletedCrop(c)}
                  keepSelection
                  // No `aspect` prop -- that's what makes this freeform,
                  // unlike the preview-frame step's locked aspect={1}.
                  // No `minWidth`/`minHeight` either (round 9) -- see the
                  // MIN_CROP_SIZE_PX comment above; enforced ourselves in
                  // the Beskär button's disabled check instead.
                >
                  <img
                    ref={imgRef}
                    src={image}
                    alt=""
                    className="max-h-[328px] max-w-full"
                    onLoad={handleImageLoad}
                  />
                </ReactCrop>
              </div>
              {/* Scoped to this dialog's own wrapper class, not a global
                  override. Confirmed live: .ReactCrop__drag-handle/-bar
                  (the corner/edge resize handles) turned out to be
                  DESCENDANTS of .ReactCrop__crop-selection, not siblings --
                  disabling pointer-events on the parent cascaded down and
                  silently disabled resizing too, not just the whole-box
                  move this was meant to block. pointer-events is an
                  inherited CSS property, so re-enabling it explicitly on
                  the handles overrides that inherited `none` regardless of
                  the actual nesting -- correct either way, whether they're
                  descendants (this fix) or were siblings all along
                  (harmless no-op in that case).

                  touch-action, round 6: react-image-crop's own stylesheet
                  sets `touch-action: none` only on .ReactCrop__crop-
                  selection itself (plus the image), not on the handles/
                  bars -- fine normally, since a descendant's *effective*
                  touch-action is supposed to intersect with its ancestors'.
                  But that ancestor is exactly the element we just set
                  pointer-events:none on above, and mobile Safari/Chrome
                  were confirmed live to still hand a touchstart landing on
                  a handle to native scroll/pan handling instead of to
                  react-image-crop's onPointerDown (which reads
                  data-ord off e.target via bubbling -- pointer-events:auto
                  makes the handle a valid hit-test target and bubbling
                  is unaffected by an ancestor's pointer-events, but the
                  BROWSER's pre-JS decision of "is this gesture a scroll"
                  is a separate, touch-action-driven check that isn't
                  guaranteed to inherit reliably through a reassigned
                  pointer-events chain). Setting touch-action:none directly
                  on the handles/bars removes any dependency on that
                  ancestor inheritance and is correct regardless of which
                  browser behavior caused the mobile failure.

                  round 7: user-supplied screenshot on an iOS PWA showed the
                  dashed selection outline tracing the image correctly, but
                  NO visible handle at any corner -- the library's own
                  default handle style (--rc-drag-handle-bg-colour: #0003,
                  a ~20%-opacity black fill, with a 1px semi-transparent
                  white border) is nominally present and functionally wired
                  up (round 5/6 already fixed hit-testing), but reads as
                  near-invisible against a busy/dark real photo -- the user
                  had no visible affordance to find, so "can't drag the
                  handles" was actually "can't find the handles to drag."
                  Overridden below with a fixed-contrast style (solid white
                  fill, dark border, drop shadow) that reads the same way
                  regardless of what's underneath, instead of the library's
                  translucent default which was designed to blend in.

                  round 8: a real user report -- "unable to pull the crop
                  handles for rectangle shaped image" -- traced to
                  react-image-crop's OWN default stylesheet (not anything
                  from round 5/6/7), confirmed by reading its source
                  directly: `@media (pointer:coarse){.ord-n,.ord-e,.ord-s,
                  .ord-w{display:none}}` unconditionally hides the four
                  MID-EDGE handles/bars on any touchscreen, leaving only
                  the 4 corners -- and a corner drag always recomputes
                  BOTH width and height together (confirmed in
                  resizeCrop()'s source: corners are in the "xyOrds" set,
                  which never resizes a single axis independently). So on
                  mobile there was never a way to trim just one side of a
                  photo while keeping the other dimension untouched --
                  exactly the natural gesture "rectangle shaped image"
                  implies (crop off empty width, keep full height, or vice
                  versa), and exactly what a square photo doesn't
                  especially invite trying (shrinking evenly via a corner
                  already looks right for a square). This was true from
                  round 3 onward, not a round 6/7 regression -- it just
                  took a real rectangular photo + a user who wanted
                  single-axis trimming to surface it. Fixed by overriding
                  the library's own hide rule for our freeform (no aspect
                  lock) use case, restoring the same mid-edge affordance
                  desktop mouse users already had (mouse never triggers
                  `pointer:coarse`, so this was mobile-only). The existing
                  handle-dot styling above already applies to ord-n/e/s/w
                  too (not corner-scoped), so no extra visibility work
                  needed once unhidden. */}
              <style>{`
                .pif-trim-crop .ReactCrop__crop-selection {
                  pointer-events: none;
                  cursor: default;
                }
                .pif-trim-crop .ReactCrop__drag-handle,
                .pif-trim-crop .ReactCrop__drag-bar {
                  pointer-events: auto;
                  touch-action: none;
                }
                .pif-trim-crop .ReactCrop__drag-handle {
                  width: 20px;
                  height: 20px;
                  background-color: #ffffff;
                  border: 2px solid #1a1a1a;
                  border-radius: 9999px;
                  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
                }
                @media (pointer: coarse) {
                  .pif-trim-crop .ReactCrop__drag-handle {
                    width: 28px;
                    height: 28px;
                  }
                  .pif-trim-crop .ReactCrop .ord-n,
                  .pif-trim-crop .ReactCrop .ord-e,
                  .pif-trim-crop .ReactCrop .ord-s,
                  .pif-trim-crop .ReactCrop .ord-w {
                    display: block;
                  }
                }
              `}</style>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {t("post.rotate", { defaultValue: "Rotera" })}
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRotate(-1)}
                    disabled={isRotating}
                    aria-label={t("post.rotate_left", { defaultValue: "Rotera moturs" })}
                  >
                    {isRotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRotate(1)}
                    disabled={isRotating}
                    aria-label={t("post.rotate_right", { defaultValue: "Rotera medurs" })}
                  >
                    {isRotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("common.cancel", { defaultValue: "Avbryt" })}
            </Button>
            <Button type="button" variant="outline" onClick={onSkip} disabled={isApplying}>
              {t("post.skip_trim", { defaultValue: "Hoppa över" })}
            </Button>
            <Button
              type="button"
              onClick={() => setTrimConfirmOpen(true)}
              disabled={
                !completedCrop?.width ||
                completedCrop.width < MIN_CROP_SIZE_PX ||
                completedCrop.height < MIN_CROP_SIZE_PX ||
                isApplying
              }
            >
              {isApplying ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CropIcon className="h-4 w-4 mr-1" />
              )}
              {t("post.trim_image", { defaultValue: "Beskär" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={trimConfirmOpen} onOpenChange={setTrimConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("post.trim_confirm_title", { defaultValue: "Beskär bilden permanent?" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("post.trim_confirm_description", {
                defaultValue:
                  "Delarna utanför rutan tas bort permanent från bilden. Detta kan inte ångras. Vill du fortsätta?",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">
              {t("common.cancel", { defaultValue: "Avbryt" })}
            </AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleTrimConfirm}>
              {t("post.trim_confirm_action", { defaultValue: "Ja, beskär" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
