
import React from "react";

interface ImagePreviewProps {
  images: string[];
}

export function ImagePreview({ images }: ImagePreviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image, index) => (
        <div key={index} className="relative">
          <img
            src={image}
            alt={`Preview ${index + 1}`}
            className="w-full h-40 object-cover rounded-lg"
          />
          {index === 0 && (
            <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-md text-xs">
              Primary
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
