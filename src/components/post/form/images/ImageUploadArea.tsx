
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Camera } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageUploadAreaProps {
  isRequest: boolean;
  canAddMoreImages: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ImageUploadArea({
  isRequest,
  canAddMoreImages,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onImageUpload,
  fileInputRef,
}: ImageUploadAreaProps) {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  if (!canAddMoreImages) {
    return null;
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">
            {isRequest ? t('post.add_reference_image') : t('post.drag_drop_image')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('post.png_jpg_webp')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClick}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{t('post.choose_image')}</span>
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span>{t('interactions.take_photo')}</span>
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
