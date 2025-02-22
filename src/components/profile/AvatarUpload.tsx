
import { useState } from "react";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const handleEditCurrent = () => {
    if (avatarUrl) {
      setTempImage(avatarUrl);
      setShowCropper(true);
    }
  };

  const handleSaveCrop = async (croppedAreaPixels: any) => {
    if (!tempImage) return;
    
    try {
      const image = await getCroppedImg(tempImage, croppedAreaPixels);
      if (image) {
        onFileChange(image);
        setShowCropper(false);
        setTempImage(null);
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
            <ImageCropper
              image={tempImage}
              onSave={handleSaveCrop}
              onCancel={() => setShowCropper(false)}
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
