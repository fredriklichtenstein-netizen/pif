import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Undo2, RotateCcw, RotateCw, Loader2 } from "lucide-react";
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
}

/**
 * Preview-frame picker (+ rotate, Trello C4) for newly uploaded post images.
 * The crop-FRAME selection is never applied to the file — this only records
 * which square region (as fractions of the image) should be used to frame
 * the feed/card thumbnail; the full original is always what's uploaded and
 * shown when a viewer opens the image. Rotation is the one thing here that
 * DOES genuinely re-encode the file (handled by the caller via onRotate,
 * see useImageCropQueue) -- a sideways photo needs the actual stored image
 * fixed, not just its thumbnail framing, since that full original is
 * exactly what the lightbox view above would otherwise still show sideways.
 */
export function PostImageCropDialog({
  image,
  progress,
  onSave,
  onSkip,
  onCancel,
  onRotate,
  isRotating = false,
}: PostImageCropDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
    setNaturalSize(null);
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

  const isPristine = zoom === 1 && crop.x === 0 && crop.y === 0;

  return (
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
                "Välj vilken del av bilden som visas i flödesöversikten. Hela bilden sparas alltid och visas i sin helhet när någon klickar på den.",
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
          <Button type="button" onClick={handleSave} disabled={!pixels}>
            {t("post.apply_crop", { defaultValue: "Spara" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
