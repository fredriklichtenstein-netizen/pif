import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePostImageUpload } from "./post/usePostImageUpload";
import { usePostFormInitializer } from "./post/usePostFormInitializer";
import type { PostFormData } from "@/types/post";

export function usePostForm(initialData?: any) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadImages, isAnalyzing } = usePostImageUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    condition: initialData?.condition || "",
    item_type: initialData?.item_type || "offer", // Nytt fält
    coordinates: initialData?.coordinates ? {
      lat: typeof initialData.coordinates === 'object' && initialData.coordinates !== null ? 
           (initialData.coordinates as any).y : null,
      lng: typeof initialData.coordinates === 'object' && initialData.coordinates !== null ? 
           (initialData.coordinates as any).x : null 
    } : null,
    location: initialData?.location || "",
    images: initialData?.images || [],
    measurements: initialData?.measurements || {},
  });

  const handleImageUpload = (file: File) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: [...prevFormData.images, file],
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: images,
    }));
  };

  const handleMeasurementChange = (
    name: string,
    value: string,
  ) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      measurements: {
        ...prevFormData.measurements,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.condition || !formData.coordinates || formData.images.length === 0) {
      toast({
        title: "Obligatoriska fält saknas",
        description: "Vänligen fyll i alla obligatoriska fält och lägg till minst en bild.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedImages = await uploadImages(formData.images);
      
      const insertData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        item_type: formData.item_type, // Nytt fält
        pif_status: 'active', // Default status
        coordinates: `POINT(${formData.coordinates.lng} ${formData.coordinates.lat})`,
        location: formData.location,
        images: uploadedImages,
        measurements: formData.measurements,
      };

      let result;
      if (initialData?.id) {
        // Update existing item
        result = await supabase
          .from("items")
          .update(insertData)
          .eq("id", initialData.id);
      } else {
        // Create new item
        result = await supabase
          .from("items")
          .insert([insertData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Framgång!",
        description: initialData?.id ? "Din PIF har uppdaterats." : "Din PIF har skapats.",
      });

      navigate("/feed");
    } catch (error: any) {
      console.error("Error submitting post:", error);
      toast({
        title: "Fel",
        description: error.message || "Något gick fel när din PIF skulle sparas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isAnalyzing,
    setFormData,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  };
}
