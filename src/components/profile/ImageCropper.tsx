
import { useState } from "react";
import Cropper from 'react-easy-crop';
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
  image: string;
  onSave: (croppedAreaPixels: any) => void;
  onCancel: () => void;
  cropShape?: 'round' | 'rect';
}

export function ImageCropper({ 
  image, 
  onSave, 
  onCancel,
  cropShape = 'rect' 
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = async (_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  };

  const handleSave = () => {
    if (croppedAreaPixels) {
      onSave(croppedAreaPixels);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative h-[300px] w-full">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Zoom</label>
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={([value]) => setZoom(value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}
