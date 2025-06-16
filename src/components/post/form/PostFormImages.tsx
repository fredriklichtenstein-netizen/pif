
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Camera, Image } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PostFormImagesProps {
  images: string[];
  isAnalyzing: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImagesChange: (images: string[]) => void;
  itemType?: 'offer' | 'request';
}

export function PostFormImages({
  images,
  isAnalyzing,
  onImageUpload,
  onImagesChange,
  itemType = 'offer',
}: PostFormImagesProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRequest = itemType === 'request';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0 && fileInputRef.current) {
      // Create a new DataTransfer object and add the file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(imageFiles[0]);
      
      // Set the files on the input element
      fileInputRef.current.files = dataTransfer.files;
      
      // Create a synthetic change event
      const syntheticEvent = {
        target: fileInputRef.current,
        currentTarget: fileInputRef.current,
        nativeEvent: new Event('change'),
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: Event.AT_TARGET,
        isTrusted: true,
        preventDefault: () => {},
        isDefaultPrevented: () => false,
        stopPropagation: () => {},
        isPropagationStopped: () => false,
        persist: () => {},
        timeStamp: Date.now(),
        type: 'change'
      } as React.ChangeEvent<HTMLInputElement>;
      
      // Trigger the upload handler
      onImageUpload(syntheticEvent);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const getTitle = () => {
    return isRequest ? "Referensbild" : "Bilder";
  };

  const getDescription = () => {
    if (isRequest) {
      return "Ladda upp en bild som visar vad du söker eller något liknande för att hjälpa andra förstå din önskning bättre.";
    }
    return "Ladda upp bilder på varan du vill piffa.";
  };

  const getPlaceholder = () => {
    if (isRequest) {
      return "Lägg till referensbild som visar vad du söker";
    }
    return "Lägg till bilder på varan";
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">{getTitle()} *</Label>
        <p className="text-sm text-muted-foreground">
          {getDescription()}
        </p>
      </div>

      {/* Upload Area */}
      <Card 
        className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
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

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            {isRequest ? "Vald referensbild:" : "Valda bilder:"}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`${isRequest ? 'Referensbild' : 'Uploaded'} ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional info for requests */}
      {isRequest && images.length > 0 && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p><strong>Tips:</strong> Din referensbild hjälper andra att förstå vad du söker, även om de inte har exakt samma sak.</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>Analyserar bild...</span>
        </div>
      )}
    </div>
  );
}
