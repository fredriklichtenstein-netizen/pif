
import { Camera, Upload, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface UploadOptionsProps {
  onFileSelect: () => void;
  onEditCurrent: () => void;
  hasExistingImage: boolean;
}

export function UploadOptions({ onFileSelect, onEditCurrent, hasExistingImage }: UploadOptionsProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      toast({ title: t('interactions.camera_capture'), description: t('interactions.camera_coming_soon') });
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      toast({ title: t('interactions.error_title'), description: t('interactions.camera_error', { error: error.message }), variant: "destructive" });
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
      <Button type="button" variant="outline" onClick={handleCameraCapture} className="w-full">
        <Camera className="h-4 w-4 mr-2" />{t('interactions.take_photo')}
      </Button>
    </div>
  );
}
