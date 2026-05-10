import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PostImageCropDialogProps {
  image: string | null;
  progress: { current: number; total: number } | null;
  onSave: (pixelCrop: { width: number; height: number; x: number; y: number }) => void;
  onSkip: () => void;
  onCancel: () => void;
}

/**
 * Cropping dialog for newly uploaded post images. Free aspect ratio with
 * zoom + pan; the user can either save the crop or skip it for that image.
 */
export function PostImageCropDialog({
  image,
  progress,
  onSave,
  onSkip,
  onCancel,
}: PostImageCropDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<any>(null);

  // Reset crop when a new image becomes active.
  React.useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
  }, [image]);

  const handleSave = () => {
    if (pixels) onSave(pixels);
  };

  return (
    <Dialog open={!!image} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {t("post.crop_image", { defaultValue: "Crop image" })}
            {progress && progress.total > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({progress.current}/{progress.total})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {image && (
          <div className="space-y-4">
            <div className="relative h-[320px] w-full bg-muted rounded-md overflow-hidden">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={undefined}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_a, p) => setPixels(p)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("post.zoom", { defaultValue: "Zoom" })}
              </label>
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
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button type="button" variant="secondary" onClick={onSkip}>
            {t("post.skip_crop", { defaultValue: "Skip" })}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!pixels}>
            {t("post.apply_crop", { defaultValue: "Apply crop" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
