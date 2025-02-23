
import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper } from "./ImageCropper";
import { UploadOptions } from "./UploadOptions";
import { getCroppedImg } from "@/utils/imageProcessing";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onFileChange: (file: File) => void;
}

export function AvatarUpload({ avatarUrl, onFileChange }: AvatarUploadProps) {
  const { toast } = useToast();
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
        setIsEditing(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleEditCurrent = useCallback(() => {
    if (avatarUrl) {
      setTempImage(avatarUrl);
      setShowCropper(true);
      setIsEditing(true);
    }
  }, [avatarUrl]);

  const handleSaveCrop = useCallback(async (croppedAreaPixels: any) => {
    if (!tempImage) return;
    
    try {
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
      if (croppedImage) {
        onFileChange(croppedImage);
        setShowCropper(false);
        setTempImage(null);
        setIsEditing(false);
      } else {
        throw new Error('Failed to process image');
      }
    } catch (e) {
      console.error('Cropping error:', e);
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    }
  }, [tempImage, onFileChange, toast]);

  const handleCancel = useCallback(() => {
    setShowCropper(false);
    setTempImage(null);
    setIsEditing(false);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Dialog open={showCropper} onOpenChange={(open) => {
        if (!open) handleCancel();
      }}>
        <Avatar 
          className="h-32 w-32 cursor-pointer" 
          onClick={() => {
            if (!showCropper) {
              setShowCropper(true);
            }
          }}
        >
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>
            <Upload className="h-8 w-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
          </DialogHeader>
          
          {tempImage ? (
            <ImageCropper
              image={tempImage}
              onSave={handleSaveCrop}
              onCancel={handleCancel}
            />
          ) : (
            <UploadOptions
              onFileSelect={() => document.getElementById('avatar-upload')?.click()}
              onEditCurrent={handleEditCurrent}
              hasExistingImage={!!avatarUrl}
            />
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

