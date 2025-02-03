import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CreatePostInput } from "@/types/post";
import { useQueryClient } from "@tanstack/react-query";
import { addPost } from "./Index";

const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Shoes",
  "Toys",
  "Children's Clothing",
  "Other",
];

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Well Loved",
];

const CATEGORY_MEASUREMENTS: { [key: string]: string[] } = {
  "Clothing": ["Chest", "Length", "Shoulders", "Sleeves"],
  "Shoes": ["EU Size", "US Size", "UK Size", "Insole Length"],
  "Children's Clothing": ["Age", "Height", "Chest", "Length"],
  "Furniture": ["Width", "Depth", "Height"],
};

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
    status: "available", // Added default status
  });

  const geocodeAddress = async (address: string) => {
    if (!address || !mapboxToken) {
      toast({
        title: "Missing Mapbox token",
        description: "Please enter your Mapbox token first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxToken}&country=SE`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setFormData(prev => ({
          ...prev,
          coordinates: { lat, lng },
          location: address,
        }));
        
        toast({
          title: "Location found",
          description: "Address has been successfully geocoded.",
        });
      } else {
        toast({
          title: "Location not found",
          description: "Please enter a valid address in Sweden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Error",
        description: "Failed to geocode address. Please try again.",
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
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="What are you giving away?"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="condition" className="text-sm font-medium">
            Condition
          </label>
          <Select
            value={formData.condition}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, condition: value }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.category && CATEGORY_MEASUREMENTS[formData.category] && (
          <div className="space-y-4">
            <label className="text-sm font-medium">Measurements</label>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORY_MEASUREMENTS[formData.category].map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm text-gray-600">{field}</label>
                  <Input
                    value={formData.measurements[field] || ""}
                    onChange={(e) => handleMeasurementChange(field, e.target.value)}
                    placeholder={field}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <div className="flex gap-2">
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Enter your address"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => geocodeAddress(formData.location)}
              disabled={isGeocoding || !formData.location}
            >
              {isGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
          {formData.coordinates && (
            <p className="text-sm text-muted-foreground">
              Location verified ✓
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe your item (condition, size, etc.)"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="images" className="text-sm font-medium">
            Images
          </label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {formData.images.map((image, index) => (
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
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

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