
import { useRef } from "react";
import { Camera, Upload, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface UploadOptionsProps {
  onFileSelect: () => void;
  onEditCurrent: () => void;
  hasExistingImage: boolean;
  onCameraCapture?: () => void;
}

export function UploadOptions({ onFileSelect, onEditCurrent, hasExistingImage, onCameraCapture }: UploadOptionsProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const handleCameraClick = () => {
    if (onCameraCapture) {
      onCameraCapture();
    } else {
      // Fallback: trigger the avatar camera input (front camera)
      document.getElementById('avatar-camera-capture')?.click();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Button type="button" variant="outline" onClick={onFileSelect} className="w-full">
        <Upload className="h-4 w-4 mr-2" />{t('interactions.upload_photo')}
      </Button>
      {hasExistingImage && (
        <Button type="button" variant="outline" onClick={onEditCurrent} className="w-full">
          <Edit2 className="h-4 w-4 mr-2" />{t('interactions.edit_current_photo')}
        </Button>
      )}
      {isMobile && (
        <Button type="button" variant="outline" onClick={handleCameraClick} className="w-full">
          <Camera className="h-4 w-4 mr-2" />{t('interactions.take_photo')}
        </Button>
      )}
    </div>
  );
}
