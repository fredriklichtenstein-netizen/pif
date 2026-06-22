import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PostImageCropDialogProps {
  image: string | null;
  progress: { current: number; total: number } | null;
  onSave: (pixelCrop: { width: number; height: number; x: number; y: number }) => void;
  onSkip?: () => void;
  onCancel: () => void;
}

/**
 * Cropping dialog for newly uploaded post images. Free aspect ratio with
 * zoom + pan; the user can either save the crop or cancel it for that image.
 */
export function PostImageCropDialog({
  image,
  progress,
  onSave,
  onCancel,
}: PostImageCropDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<any>(null);

  React.useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
  }, [image]);

  const handleSave = () => {
    if (pixels) onSave(pixels);
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
            {t("post.crop_image", { defaultValue: "Beskär bild" })}
            {progress && progress.total > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({progress.current}/{progress.total})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {t("post.crop_image_description", {
              defaultValue:
                "Dra bilden för att justera positionen och använd reglaget för att zooma in eller ut.",
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
                aspect={undefined}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_a, p) => setPixels(p)}
              />
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
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
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
          <Button type="button" onClick={handleSave} disabled={!pixels}>
            {t("post.apply_crop", { defaultValue: "Beskär" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
