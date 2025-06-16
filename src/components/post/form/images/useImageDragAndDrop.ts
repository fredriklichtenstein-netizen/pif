
import { useState, useRef } from "react";

interface UseImageDragAndDropProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRequest: boolean;
}

export function useImageDragAndDrop({
  images,
  onImagesChange,
  onImageUpload,
  isRequest,
}: UseImageDragAndDropProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return {
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
  };
}
