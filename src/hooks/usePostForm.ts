
import { useState, useEffect } from "react";
import { CreatePostInput } from "@/types/post";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

const DEFAULT_FORM_DATA: CreatePostInput = {
  title: "",
  description: "",
  category: "",
  condition: "",
  images: [],
  location: "",
  address: "",
  coordinates: null,
  dimensions: {
    width: "",
    height: "",
    depth: "",
  },
  weight: "",
  measurements: {},
};

export function usePostForm(initialData?: any) {
  const [formData, setFormData] = useState<CreatePostInput>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  useEffect(() => {
    // If initialData is provided, set it as the form data
    if (initialData) {
      // Transform the initialData into the expected format
      const transformedData: CreatePostInput = {
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category || "",
        condition: initialData.condition || "",
        images: initialData.images || [],
        location: initialData.location || "",
        address: initialData.address || "",
        coordinates: initialData.coordinates || null,
        dimensions: {
          width: initialData.dimensions?.width || "",
          height: initialData.dimensions?.height || "",
          depth: initialData.dimensions?.depth || "",
        },
        weight: initialData.weight || "",
        measurements: initialData.measurements || {},
      };
      
      setFormData(transformedData);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAnalyzing(true);
    const files = Array.from(e.target.files || []);

    if (!files || files.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    const uploadPromises = files.map(async (file) => {
      const { supabase } = await import("@/integrations/supabase/client");
      const timestamp = new Date().getTime();
      const filePath = `images/${user?.id}/${timestamp}-${file.name}`;

      const { error } = await supabase.storage
        .from("lovable-uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error uploading image",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const { data } = supabase.storage
        .from("lovable-uploads")
        .getPublicUrl(filePath);
      return data.publicUrl;
    });

    const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    }

    setIsAnalyzing(false);
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    
    // If we're editing an existing post, use update instead of insert
    const isEditing = !!initialData;

    try {
      e.preventDefault();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create a post",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      const { supabase } = await import("@/integrations/supabase/client");
      
      const postData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        images: formData.images,
        location: formData.location,
        address: formData.address,
        coordinates: formData.coordinates,
        dimensions: formData.dimensions,
        weight: formData.weight,
        measurements: formData.measurements,
        user_id: user.id,
      };

      let result;
      
      if (isEditing) {
        // Update existing post
        result = await supabase
          .from("items")
          .update(postData)
          .eq("id", initialData.id);
      } else {
        // Insert new post
        result = await supabase
          .from("items")
          .insert(postData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: isEditing ? "Post updated" : "Post created",
        description: isEditing 
          ? "Your PIF has been updated successfully" 
          : "Your PIF has been created successfully",
      });

      // Navigate to profile page
      navigate("/profile");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    isAnalyzing,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  };
}
