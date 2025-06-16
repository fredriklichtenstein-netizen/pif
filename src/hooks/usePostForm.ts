
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePostImageUpload } from "./post/usePostImageUpload";
import type { PostFormData } from "@/types/post";

export function usePostForm(initialData?: any) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    condition: initialData?.condition || "",
    item_type: initialData?.item_type || "offer",
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

  const { handleImageUpload: uploadHandler, isAnalyzing } = usePostImageUpload({
    onImagesUploaded: (urls: string[]) => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
    }
  });

  const handleImageUpload = (file: File) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: [...prevFormData.images, URL.createObjectURL(file)],
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
    
    console.log("Form submission started");
    console.log("Form data validation:", {
      title: !!formData.title,
      category: !!formData.category,
      condition: !!formData.condition,
      coordinates: !!formData.coordinates,
      images: formData.images.length,
      item_type: formData.item_type
    });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Inte inloggad",
        description: "Du måste vara inloggad för att skapa en PIF eller önskan.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
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
      console.log("Starting database insertion...");
      
      // Format coordinates as a string in the format PostgreSQL expects
      let coordinatesForDB = null;
      if (formData.coordinates && formData.coordinates.lat !== null && formData.coordinates.lng !== null) {
        // Use a simple format that PostgreSQL can interpret
        coordinatesForDB = `(${formData.coordinates.lng},${formData.coordinates.lat})`;
        console.log("Formatted coordinates for DB:", coordinatesForDB);
      }
      
      const insertData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        item_type: formData.item_type,
        pif_status: 'active',
        user_id: user.id, // Add user_id to satisfy RLS policy
        coordinates: coordinatesForDB,
        location: formData.location,
        images: formData.images,
        measurements: formData.measurements,
      };

      console.log("Insert data prepared:", insertData);

      let result;
      if (initialData?.id) {
        console.log("Updating existing item:", initialData.id);
        result = await supabase
          .from("items")
          .update(insertData)
          .eq("id", initialData.id);
      } else {
        console.log("Inserting new item...");
        result = await supabase
          .from("items")
          .insert([insertData]);
      }

      console.log("Database operation result:", result);

      if (result.error) {
        console.error("Supabase error details:", {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        throw result.error;
      }

      console.log("Success! Showing toast and navigating...");
      
      toast({
        title: "Framgång!",
        description: initialData?.id ? "Din PIF har uppdaterats." : 
                     formData.item_type === 'request' ? "Din önskan har skapats." : "Din PIF har skapats.",
      });

      navigate("/feed");
    } catch (error: any) {
      console.error("Error in handleSubmit:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = "Något gick fel när din PIF skulle sparas.";
      
      if (error.message?.includes('invalid input syntax for type point')) {
        errorMessage = "Problem med platsdata. Försök välja en annan adress.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fel",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Setting isSubmitting to false");
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
