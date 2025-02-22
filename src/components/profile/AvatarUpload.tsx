
import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import Cropper from 'react-easy-crop';
import { Slider } from "@/components/ui/slider";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onFileChange: (file: File) => void;
}

export function AvatarUpload({ avatarUrl, onFileChange }: AvatarUploadProps) {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      toast({
        title: "Camera capture",
        description: "Camera capture feature coming soon!",
      });
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Unable to access camera: " + error.message,
        variant: "destructive",
      });
    }
  };

  const onCropComplete = async (_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  };

  const handleSaveCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    
    try {
      const image = await getCroppedImg(tempImage, croppedAreaPixels);
      if (image) {
        onFileChange(image);
        setShowCropper(false);
        setTempImage(null);
        setCroppedAreaPixels(null);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Dialog open={showCropper} onOpenChange={(open) => {
        setShowCropper(open);
        if (!open) {
          setTempImage(null);
          setCroppedAreaPixels(null);
          setZoom(1);
          setCrop({ x: 0, y: 0 });
        }
      }}>
        <DialogTrigger asChild>
          <Avatar className="h-32 w-32 cursor-pointer">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>
              <Upload className="h-8 w-8 text-gray-400" />
            </AvatarFallback>
          </Avatar>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
          </DialogHeader>
          
          {tempImage ? (
            <div className="space-y-4">
              <div className="relative h-[300px] w-full">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
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
                <Button type="button" variant="secondary" onClick={() => setShowCropper(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveCrop}>
                  Save
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraCapture}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take photo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number }
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas dimensions to match the desired crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Create a circular clipping path
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    0,
    2 * Math.PI,
    true
  );
  ctx.clip();

  // Draw the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (!blob) {
        resolve(null);
        return;
      }
      const file = new File([blob], 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      resolve(file);
    }, 'image/jpeg');
  });
}
