
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { CreatePostInput } from "@/types/post";
import { PostFormHeader } from "./form/PostFormHeader";
import { PostFormMeasurements } from "./form/PostFormMeasurements";
import { PostFormLocation } from "./form/PostFormLocation";
import { PostFormDescription } from "./form/PostFormDescription";
import { PostFormImages } from "./form/PostFormImages";

interface PostFormProps {
  formData: CreatePostInput;
  isSubmitting: boolean;
  isGeocoding: boolean;
  isAnalyzing: boolean;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
  onGeocodeAddress: () => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMeasurementChange: (field: string, value: string) => void;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
}

export function PostForm({
  formData,
  isSubmitting,
  isGeocoding,
  isAnalyzing,
  onFormSubmit,
  onGeocodeAddress,
  onImageUpload,
  onMeasurementChange,
  setFormData,
}: PostFormProps) {
  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <form onSubmit={onFormSubmit} className="space-y-6 max-w-2xl mx-auto">
        <PostFormHeader
          title={formData.title}
          category={formData.category}
          condition={formData.condition}
          onTitleChange={(title) => setFormData(prev => ({ ...prev, title }))}
          onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
          onConditionChange={(condition) => setFormData(prev => ({ ...prev, condition }))}
        />

        <PostFormMeasurements
          category={formData.category}
          measurements={formData.measurements}
          onMeasurementChange={onMeasurementChange}
        />

        <PostFormLocation
          location={formData.location}
          coordinates={formData.coordinates}
          isGeocoding={isGeocoding}
          onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
          onGeocodeAddress={onGeocodeAddress}
        />

        <PostFormDescription
          description={formData.description}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
        />

        <PostFormImages
          images={formData.images}
          isAnalyzing={isAnalyzing}
          onImageUpload={onImageUpload}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Item"
          )}
        </Button>
      </form>
    </div>
  );
}
