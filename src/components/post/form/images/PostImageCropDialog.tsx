import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { Undo2, RotateCcw, RotateCw, Crop, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ImageCrop } from "@/types/post";

interface PostImageCropDialogProps {
  image: string | null;
  progress: { current: number; total: number } | null;
  /** Fractions (0-1) of the image's own dimensions — never a re-encoded file. */
  onSave: (crop: ImageCrop) => void;
  onSkip: () => void;
  onCancel: () => void;
  /** Trello C4: rotates the underlying file itself (see useImageCropQueue) --
   *  unlike the crop-frame selection this dialog otherwise only *records*,
   *  a sideways photo needs the actual stored image fixed. 1 = clockwise,
   *  -1 = counter-clockwise. */
  onRotate: (direction: 1 | -1) => void;
  isRotating?: boolean;
  /** Trello C4 round 2: PERMANENTLY crops the file to the current
   *  crop-rectangle selection (pixel coordinates, from the same
   *  onCropComplete this dialog already uses for onSave) -- distinct from
   *  onSave, which only ever records preview-frame metadata. Confirmed via
   *  an AlertDialog before firing, since unlike rotate this can't be
   *  undone -- the cropped-away pixels are genuinely gone. */
  onTrim: (pixelCrop: { x: number; y: number; width: number; height: number }) => void;
  isTrimming?: boolean;
}

/**
 * Preview-frame picker (+ rotate/trim, Trello C4) for newly uploaded post
 * images. The crop-FRAME selection ("Save"/"Use default view") is never
 * applied to the file — it only records which square region should frame
 * the feed/card thumbnail; the full original is what's uploaded and shown
 * by default when a viewer opens the lightbox. Rotate and Trim both
 * genuinely re-encode the file instead (handled by the caller, see
 * useImageCropQueue) -- a sideways photo or an unwanted edge needs the
 * actual stored image changed, not just its thumbnail framing, since that
 * full original is exactly what the lightbox view would otherwise still
 * show unchanged. Trim is the one irreversible action here, so it's gated
 * behind a confirmation step.
 */
export function PostImageCropDialog({
  image,
  progress,
  onSave,
  onSkip,
  onCancel,
  onRotate,
  isRotating = false,
  onTrim,
  isTrimming = false,
}: PostImageCropDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [trimConfirmOpen, setTrimConfirmOpen] = useState(false);

  React.useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
    setNaturalSize(null);
    setTrimConfirmOpen(false);
  }, [image]);

  const handleSave = () => {
    if (!pixels || !naturalSize || !naturalSize.width || !naturalSize.height) return;
    onSave({
      x: pixels.x / naturalSize.width,
      y: pixels.y / naturalSize.height,
      width: pixels.width / naturalSize.width,
      height: pixels.height / naturalSize.height,
    });
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleTrimConfirm = () => {
    if (!pixels) return;
    setTrimConfirmOpen(false);
    onTrim(pixels);
  };

  const isPristine = zoom === 1 && crop.x === 0 && crop.y === 0;

  return (
    <>
      <Dialog open={!!image} onOpenChange={(open) => { if (!open) onCancel(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {t("post.choose_preview_area", { defaultValue: "Välj översiktsområde" })}
              {progress && progress.total > 1 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({progress.current}/{progress.total})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {t("post.choose_preview_area_description", {
                defaultValue:
                  "Välj vilken del av bilden som visas i flödesöversikten. Bilden sparas som standard i sin helhet och visas hel när någon klickar på den — men du kan beskära bort resten permanent med knappen Beskär.",
              })}
            </DialogDescription>
          </DialogHeader>

          {image && (
            <div className="space-y-4">
              <div className="relative h-[320px] w-full bg-muted rounded-md overflow-hidden">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_a, p) => setPixels(p)}
                  onMediaLoaded={(size) => setNaturalSize({ width: size.naturalWidth, height: size.naturalHeight })}
                />
              </div>

              {/* Trello C4: ±90° only (not a freeform straighten dial) --
                  covers the common real case (sideways/upside-down photo)
                  with simple, low-risk canvas math (swap width/height,
                  redraw), matching Instagram/Marketplace-style listing
                  flows rather than a dedicated photo editor's precision
                  tools. Disabled while a rotation is in flight so a second
                  tap can't fire before the file/preview finish swapping. */}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t("post.zoom", { defaultValue: "Zoom" })}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleReset}
                    disabled={isPristine}
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1" />
                    {t("post.reset_crop", { defaultValue: "Återställ" })}
                  </Button>
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={([v]) => setZoom(v)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("common.cancel", { defaultValue: "Avbryt" })}
            </Button>
            <Button type="button" variant="outline" onClick={onSkip}>
              {t("post.use_default_preview_area", { defaultValue: "Använd standardvy" })}
            </Button>
            {/* Permanent, unlike Save below -- gated behind a confirm
                dialog since the cropped-away pixels can't be recovered
                afterward. */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setTrimConfirmOpen(true)}
              disabled={!pixels || isTrimming}
            >
              {isTrimming ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Crop className="h-4 w-4 mr-1" />
              )}
              {t("post.trim_image", { defaultValue: "Beskär" })}
            </Button>
            <Button type="button" onClick={handleSave} disabled={!pixels}>
              {t("post.apply_crop", { defaultValue: "Spara" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sibling of the Dialog above, not nested inside it -- Radix portals
          both to document.body regardless of JSX nesting, so this is purely
          about keeping the two independent modal trees visually distinct
          in the source. */}
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
