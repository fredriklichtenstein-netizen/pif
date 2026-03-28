
import { useState, useCallback, useEffect } from "react";
import { Upload, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper } from "./ImageCropper";
import { UploadOptions } from "./UploadOptions";
import { getCroppedImg } from "@/utils/image";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onFileChange: (file: File) => void;
}

export function AvatarUpload({ avatarUrl, onFileChange }: AvatarUploadProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  useEffect(() => {
    console.log("AvatarUpload received avatarUrl:", avatarUrl);
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  const fallbackSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;

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
      setShowOptions(false);
    }
  }, [avatarUrl]);

  const handleSaveCrop = useCallback(async (croppedAreaPixels: any) => {
    if (!tempImage) return;
    
    try {
      const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
      if (croppedImage) {
        const tempPreviewUrl = URL.createObjectURL(croppedImage);
        setPreviewUrl(tempPreviewUrl);
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
        title: t('post.error'),
        description: t('interactions.crop_error'),
        variant: "destructive",
      });
    }
  }, [tempImage, onFileChange, toast, t]);

  const handleCancel = useCallback(() => {
    setShowCropper(false);
    setTempImage(null);
    setIsEditing(false);
    setShowOptions(false);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('interactions.edit_profile_picture')}</DialogTitle>
          </DialogHeader>
          
          {tempImage ? (
            <ImageCropper
              image={tempImage}
              onSave={handleSaveCrop}
              onCancel={handleCancel}
              cropShape="round"
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
      
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('interactions.profile_picture_options')}</DialogTitle>
          </DialogHeader>
          <UploadOptions
            onFileSelect={() => {
              setShowOptions(false);
              document.getElementById('avatar-upload')?.click();
            }}
            onEditCurrent={() => {
              handleEditCurrent();
              setShowOptions(false);
            }}
            hasExistingImage={!!avatarUrl}
          />
        </DialogContent>
      </Dialog>
      
      <div className="relative group">
        <Avatar 
          className="h-32 w-32 cursor-pointer border-2 border-gray-200 group-hover:border-primary transition-colors" 
          onClick={() => setShowOptions(true)}
        >
          {previewUrl ? (
            <AvatarImage 
              src={previewUrl} 
              alt="Profile picture" 
              className="object-cover"
              onError={() => {
                console.error("Error loading avatar image:", previewUrl);
                setPreviewUrl(fallbackSrc);
              }}
            />
          ) : (
            <AvatarFallback className="bg-gray-100">
              <Upload className="h-8 w-8 text-gray-400" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            className="rounded-full h-8 w-8 p-0"
            onClick={() => setShowOptions(true)}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
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
