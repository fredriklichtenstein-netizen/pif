
import React from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface ImagePreviewItemProps {
  image: string;
  index: number;
  isRequest: boolean;
  totalImages: number;
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

export function ImagePreviewItem({
  image,
  index,
  isRequest,
  totalImages,
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
}: ImagePreviewItemProps) {
  const canDrag = !isRequest && totalImages > 1;

  return (
    <div 
      className={`relative group border rounded-lg overflow-hidden bg-white transition-all duration-200 ${
        draggedIndex === index ? 'opacity-50 scale-95' : ''
      } ${
        dropTargetIndex === index ? 'border-primary border-2 bg-primary/5' : ''
      } ${
        canDrag ? 'cursor-move' : ''
      }`}
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Image number badge */}
      {!isRequest && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
          {index + 1}
          {index === 0 && <span className="ml-1 text-yellow-400">★</span>}
        </div>
      )}

      {/* Drag handle for non-requests with multiple images */}
      {canDrag && (
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
            {canDrag && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onMoveImage(index, index - 1)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onMoveImage(index, index + 1)}
                  disabled={index === totalImages - 1}
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
                onRemoveImage(index);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
