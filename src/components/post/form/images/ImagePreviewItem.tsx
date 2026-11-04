
import React from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical, ChevronUp, ChevronDown, Crop } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  /** Rotate/trim + choose the preview area for this image. */
  onEditImage: (index: number) => void;
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
  onEditImage,
}: ImagePreviewItemProps) {
  const { t } = useTranslation();
  const canDrag = !isRequest && totalImages > 1;
  const imageLabel = isRequest ? t('interactions.reference_image') : t('interactions.image_number', { number: index + 1 });

  return (
    <div 
      className={`relative group border rounded-lg overflow-hidden bg-background transition-all duration-200 ${
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
      {!isRequest && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
          {index + 1}
          {index === 0 && <span className="ml-1 text-yellow-400">★</span>}
        </div>
      )}

      {canDrag && (
        <div className="absolute top-2 right-12 z-10 bg-black/70 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {dropTargetIndex === index && draggedIndex !== index && (
        <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {t('interactions.drop_here')}
          </div>
        </div>
      )}

      <div className="flex">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => onEditImage(index)}
            aria-label={t('interactions.edit_image')}
          >
            <img
              src={image}
              alt={imageLabel}
              className="w-24 h-24 object-cover"
            />
          </button>
          {/* On the thumbnail, not at the row's right edge: there it sat in
              the same column as "Nästa", and a lagging tap removed the image. */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute bottom-1 right-1 h-7 w-7 p-0 rounded-full shadow"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveImage(index);
            }}
            aria-label={t('interactions.remove_image')}
            title={t('interactions.remove_image')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {imageLabel}
            </p>
            {!isRequest && index === 0 && (
              <p className="text-xs text-muted-foreground">{t('interactions.shown_in_feed')}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEditImage(index)}
              aria-label={t('interactions.edit_image')}
              title={t('interactions.edit_image')}
            >
              <Crop className="h-4 w-4" />
            </Button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
