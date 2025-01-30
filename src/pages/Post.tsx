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
import { ImagePlus, Loader2 } from "lucide-react";
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
  "Other",
];

const Post = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePostInput>({
    title: "",
    description: "",
    category: "",
    images: [],
    location: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Create URLs for the selected images
    const imageUrls = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="Your location"
            required
          />
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