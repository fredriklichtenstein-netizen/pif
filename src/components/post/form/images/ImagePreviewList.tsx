
import React from "react";
import { Label } from "@/components/ui/label";
import { ImagePreviewItem } from "./ImagePreviewItem";

interface ImagePreviewListProps {
  images: string[];
  isRequest: boolean;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMoveImage: (fromIndex: number, toIndex: number) => void;
  onRemoveImage: (index: number) => void;
}

export function ImagePreviewList({
  images,
  isRequest,
  draggedIndex,
  dropTargetIndex,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveImage,
  onRemoveImage,
}: ImagePreviewListProps) {
  if (images.length === 0) {
    return null;
  }

  return (
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
          <ImagePreviewItem
            key={index}
            image={image}
            index={index}
            isRequest={isRequest}
            totalImages={images.length}
            draggedIndex={draggedIndex}
            dropTargetIndex={dropTargetIndex}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onMoveImage={onMoveImage}
            onRemoveImage={onRemoveImage}
          />
        ))}
      </div>
    </div>
  );
}
