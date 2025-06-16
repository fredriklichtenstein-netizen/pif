
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, Image } from "lucide-react";

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
  const getPlaceholder = () => {
    if (isRequest) {
      return "Lägg till referensbild som visar vad du söker";
    }
    return "Lägg till bilder på varan";
  };

  if (!canAddMoreImages) {
    return null;
  }

  return (
    <Card 
      className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-muted/50 p-4 rounded-full">
          {isRequest ? (
            <Image className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">
            {getPlaceholder()}
          </h3>
          <p className="text-sm text-muted-foreground">
            Dra och släpp en bild här eller klicka för att välja
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG eller WEBP (max 10MB)
          </p>
        </div>

        <Button type="button" variant="outline" className="mt-2">
          <Upload className="h-4 w-4 mr-2" />
          Välj bild
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="hidden"
      />
    </Card>
  );
}
