
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput } from "@/types/post";

export const usePostImages = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const analyzeImage = async (imageUrl: string) => {
    try {
      setIsAnalyzing(true);
      
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageUrl },
      });

      if (error) {
        console.error('Image analysis error:', error);
        toast({
          title: "Analysis failed",
          description: "Could not analyze the image. Please fill in the details manually.",
          variant: "destructive",
        });
        return;
      }

      const updates: Partial<CreatePostInput> = {};
      if (data.title && data.title.trim()) updates.title = data.title;
      if (data.description && data.description.trim()) updates.description = data.description;
      if (data.category && data.category.trim()) updates.category = data.category;
      if (data.condition && data.condition.trim()) updates.condition = data.condition;

      setFormData(prev => ({
        ...prev,
        ...updates
      }));

      toast({
        title: "Image analyzed",
        description: "Post details have been generated from your image.",
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the image. Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeImages = async () => {
    if (formData.images.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one image to analyze.",
        variant: "destructive",
      });
      return;
    }

    await analyzeImage(formData.images[0]);
  };

  return {
    isAnalyzing,
    handleImageUpload,
    handleAnalyzeImages,
  };
};
