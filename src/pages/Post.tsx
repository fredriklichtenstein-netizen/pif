import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CreatePostInput } from "@/types/post";
import { useQueryClient } from "@tanstack/react-query";
import { addPost } from "./Index";
import { PostFormHeader } from "@/components/post/form/PostFormHeader";
import { PostFormMeasurements } from "@/components/post/form/PostFormMeasurements";
import { PostFormLocation } from "@/components/post/form/PostFormLocation";
import { PostFormDescription } from "@/components/post/form/PostFormDescription";
import { PostFormImages } from "@/components/post/form/PostFormImages";
import { geocodeAddress } from "@/utils/geocoding";

const Post = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapboxToken, setMapboxToken] = useState("");
  const [formData, setFormData] = useState<CreatePostInput>({
    title: "",
    description: "",
    category: "",
    condition: "",
    measurements: {},
    images: [],
    location: "",
    coordinates: undefined,
    status: "available",
  });

  const handleGeocodeAddress = async () => {
    if (!formData.location || !mapboxToken) {
      toast({
        title: "Missing Mapbox token",
        description: "Please enter your Mapbox token first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeocoding(true);
    try {
      const coordinates = await geocodeAddress(formData.location, mapboxToken);
      setFormData(prev => ({ ...prev, coordinates }));
      
      toast({
        title: "Location found",
        description: "Address has been successfully geocoded.",
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to geocode address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageUrls = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.coordinates) {
      toast({
        title: "Missing location",
        description: "Please enter and verify a valid address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addPost(formData);
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      toast({
        title: "Success!",
        description: "Your item has been posted.",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-4">
        <h1 className="text-2xl font-bold mb-4">Create Post</h1>
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-gray-600">
            Please enter your Mapbox public token to create a post. You can get one
            from{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mapbox
            </a>
          </p>
          <Input
            type="text"
            placeholder="Enter Mapbox token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
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
          onMeasurementChange={handleMeasurementChange}
        />

        <PostFormLocation
          location={formData.location}
          coordinates={formData.coordinates}
          isGeocoding={isGeocoding}
          onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
          onGeocodeAddress={handleGeocodeAddress}
        />

        <PostFormDescription
          description={formData.description}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
        />

        <PostFormImages
          images={formData.images}
          onImageUpload={handleImageUpload}
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
};

export default Post;