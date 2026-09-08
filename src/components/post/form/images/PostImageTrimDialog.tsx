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
 * first figure out how to draw one), can't be dragged around as a block
 * (`.ReactCrop__crop-selection` -- the whole-box move handle -- has
 * pointer-events disabled via the scoped CSS below; the corner/edge resize
 * handles are separate DOM nodes and stay fully interactive), and can't be
 * cleared entirely (`keepSelection`). Only resizing from the edges/corners
 * is possible -- confirmed via user testing that letting the box be moved
 * or lost entirely made precise trimming needlessly fiddly.
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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [trimConfirmOpen, setTrimConfirmOpen] = useState(false);

  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setTrimConfirmOpen(false);
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
      <Dialog open={!!image} onOpenChange={(open) => { if (!open) onCancel(); }}>
        <DialogContent className="sm:max-w-[480px]">
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
              <div className="pif-trim-crop flex items-center justify-center bg-muted rounded-md overflow-hidden max-h-[360px]">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(clampPercentCrop(percentCrop))}
                  onComplete={(c) => setCompletedCrop(c)}
                  keepSelection
                  minWidth={20}
                  minHeight={20}
                  // No `aspect` prop -- that's what makes this freeform,
                  // unlike the preview-frame step's locked aspect={1}.
                >
                  <img
                    ref={imgRef}
                    src={image}
                    alt=""
                    className="max-h-[360px] max-w-full"
                    onLoad={handleImageLoad}
                  />
                </ReactCrop>
              </div>
              {/* Scoped to this dialog's own wrapper class, not a global
                  override -- only .ReactCrop__crop-selection (the whole-box
                  drag-to-move handle) loses pointer-events; the separate
                  .ReactCrop__drag-handle/-bar corner/edge elements are
                  untouched by this selector and stay fully interactive. */}
              <style>{`
                .pif-trim-crop .ReactCrop__crop-selection {
                  pointer-events: none;
                  cursor: default;
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
              disabled={!completedCrop?.width || isApplying}
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
