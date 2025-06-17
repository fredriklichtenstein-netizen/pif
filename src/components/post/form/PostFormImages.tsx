
import React from "react";
import { Label } from "@/components/ui/label";
import { ImageUploadArea } from "./images/ImageUploadArea";
import { ImagePreviewList } from "./images/ImagePreviewList";
import { ImageFormTips } from "./images/ImageFormTips";
import { useImageDragAndDrop } from "./images/useImageDragAndDrop";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const isRequest = itemType === 'request';
  
  const {
    isDragOver,
    draggedIndex,
    dropTargetIndex,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    removeImage,
    moveImage,
    handleImageDragStart,
    handleImageDragOver,
    handleImageDragEnter,
    handleImageDragLeave,
    handleImageDrop,
    handleImageDragEnd,
  } = useImageDragAndDrop({
    images,
    onImagesChange,
    onImageUpload,
    isRequest,
  });

  const getTitle = () => {
    return isRequest ? t('post.step_reference_image') : t('post.step_images');
  };

  const getDescription = () => {
    if (isRequest) {
      return t('post.reference_image_description');
    }
    return t('post.images_description');
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

      <ImageUploadArea
        isRequest={isRequest}
        canAddMoreImages={canAddMoreImages}
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onImageUpload={onImageUpload}
        fileInputRef={fileInputRef}
      />

      <ImagePreviewList
        images={images}
        isRequest={isRequest}
        draggedIndex={draggedIndex}
        dropTargetIndex={dropTargetIndex}
        onDragStart={handleImageDragStart}
        onDragOver={handleImageDragOver}
        onDragEnter={handleImageDragEnter}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
        onDragEnd={handleImageDragEnd}
        onMoveImage={moveImage}
        onRemoveImage={removeImage}
      />

      <ImageFormTips isRequest={isRequest} hasImages={images.length > 0} />

      {isAnalyzing && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>{t('post.analyzing_image')}</span>
        </div>
      )}
    </div>
  );
}
