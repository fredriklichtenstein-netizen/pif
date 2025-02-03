import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onFileChange: (file: File) => void;
}

export function AvatarUpload({ avatarUrl, onFileChange }: AvatarUploadProps) {
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
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

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>
          <Upload className="h-8 w-8 text-gray-400" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          Upload photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCameraCapture}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take photo
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}