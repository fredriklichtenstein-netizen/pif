
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload, Camera, Image, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
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
      // For requests, only allow one image
      if (isRequest && images.length > 0) {
        return;
      }

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
    // For requests with an image, don't allow more uploads
    if (isRequest && images.length > 0) {
      return;
    }
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDropTargetIndex(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleImageDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear drop target if we're leaving the entire drag area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetIndex(null);
    }
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex);
    }
    
    // Reset drag state
    setDraggedIndex(null);
    setDropTargetIndex(null);
    
    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    // Reset all drag state
    setDraggedIndex(null);
    setDropTargetIndex(null);
    
    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const getTitle = () => {
    return isRequest ? "Referensbild" : "Bilder";
  };

  const getDescription = () => {
    if (isRequest) {
      return "Ladda upp en bild som visar vad du söker eller något liknande för att hjälpa andra förstå din önskning bättre.";
    }
    return "Ladda upp bilder på varan du vill piffa. Första bilden visas i flödet.";
  };

  const getPlaceholder = () => {
    if (isRequest) {
      return images.length > 0 ? "Du har redan valt en referensbild" : "Lägg till referensbild som visar vad du söker";
    }
    return "Lägg till bilder på varan";
  };

  const canAddMoreImages = !isRequest || images.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">{getTitle()} *</Label>
        <p className="text-sm text-muted-foreground">
          {getDescription()}
        </p>
      </div>

      {/* Upload Area */}
      {canAddMoreImages && (
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
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {isRequest ? "Vald referensbild:" : "Valda bilder:"}
            </Label>
            {!isRequest && images.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Dra för att ändra ordning • Bild 1 visas i flödet
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {images.map((image, index) => (
              <div 
                key={index} 
                className={`relative group border rounded-lg overflow-hidden bg-white transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dropTargetIndex === index ? 'border-primary border-2 bg-primary/5' : ''
                } ${
                  !isRequest && images.length > 1 ? 'cursor-move' : ''
                }`}
                draggable={!isRequest && images.length > 1}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnter={(e) => handleImageDragEnter(e, index)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
              >
                {/* Image number badge */}
                {!isRequest && (
                  <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {index + 1}
                    {index === 0 && <span className="ml-1 text-yellow-400">★</span>}
                  </div>
                )}

                {/* Drag handle for non-requests with multiple images */}
                {!isRequest && images.length > 1 && (
                  <div className="absolute top-2 right-12 z-10 bg-black/70 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}

                {/* Drop indicator */}
                {dropTargetIndex === index && draggedIndex !== index && (
                  <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                    <div className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Släpp här
                    </div>
                  </div>
                )}

                <div className="flex">
                  <img
                    src={image}
                    alt={`${isRequest ? 'Referensbild' : `Bild ${index + 1}`}`}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {isRequest ? 'Referensbild' : `Bild ${index + 1}`}
                      </p>
                      {!isRequest && index === 0 && (
                        <p className="text-xs text-muted-foreground">Visas i flödet</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {!isRequest && images.length > 1 && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === images.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional info */}
      {isRequest && images.length > 0 && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p><strong>Tips:</strong> Din referensbild hjälper andra att förstå vad du söker, även om de inte har exakt samma sak.</p>
        </div>
      )}

      {!isRequest && images.length > 0 && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p><strong>Tips:</strong> Bilden märkt med stjärna (★) visas först i flödet. Dra bilderna för att ändra ordning.</p>
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
