import { ImagePlus } from "lucide-react";

interface PostFormImagesProps {
  images: string[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PostFormImages({ images, onImageUpload }: PostFormImagesProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="images" className="text-sm font-medium">
        Images
      </label>
      <div className="grid grid-cols-2 gap-4 mt-2">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Preview ${index + 1}`}
            className="w-full h-40 object-cover rounded-lg"
          />
        ))}
        <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
          <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
          <span className="text-sm text-gray-500">Add photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
          />
        </label>
      </div>
    </div>
  );
}