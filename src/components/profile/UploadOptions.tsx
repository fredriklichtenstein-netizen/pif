
import { Camera, Upload, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadOptionsProps {
  onFileSelect: () => void;
  onEditCurrent: () => void;
  hasExistingImage: boolean;
}

export function UploadOptions({ onFileSelect, onEditCurrent, hasExistingImage }: UploadOptionsProps) {
  const { toast } = useToast();

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

  return (
    <div className="flex flex-col space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={onFileSelect}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload photo
      </Button>
      {hasExistingImage && (
        <Button
          type="button"
          variant="outline"
          onClick={onEditCurrent}
          className="w-full"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit current photo
        </Button>
      )}
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
  );
}
