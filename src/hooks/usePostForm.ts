
// -- REFACTORED: uses new hooks & utils

import { useState } from "react";
import { CreatePostInput } from "@/types/post";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { usePostFormInitializer } from "@/hooks/post/usePostFormInitializer";
import { usePostImageUpload } from "@/hooks/post/usePostImageUpload";

/**
 * Orchestrates post form logic, wired to new focused hooks.
 */
export function usePostForm(initialData?: any) {
  const [formData, setFormData] = useState<CreatePostInput>(usePostFormInitializer(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  // Image upload logic delegated to dedicated hook
  const {
    handleImageUpload,
    isAnalyzing,
    uploadProgress,
  } = usePostImageUpload({
    onImagesUploaded: (uploadedUrls) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    }
  });

  // For direct image list changes (used with crop/ordering UI)
  const handleImagesChange = (newImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData((prev) => {
      // Create a deep copy of measurements to prevent mutation
      const updatedMeasurements = { ...prev.measurements };
      
      // Update the dimensions field in measurements
      if (field === 'width' || field === 'height' || field === 'depth') {
        const dimensions = { ...prev.dimensions };
        dimensions[field] = value;
        
        return {
          ...prev,
          dimensions: dimensions,
          measurements: updatedMeasurements
        };
      } else {
        // For other measurements not related to dimensions
        updatedMeasurements[field] = value;
        return {
          ...prev,
          measurements: updatedMeasurements
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // format coordinates for DB: (lng,lat)
      const dbCoordinates = formData.coordinates ?
        `(${formData.coordinates.lng},${formData.coordinates.lat})` : null;
        
      // Prepare the measurements object with dimensions included
      const measurementsWithDimensions = {
        ...formData.measurements,
        // Include dimensions in the measurements object
        width: formData.dimensions?.width || "",
        height: formData.dimensions?.height || "",
        depth: formData.dimensions?.depth || "",
        // Include weight in the measurements object
        weight: formData.weight || "",
      };

      const postData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        images: formData.images,
        location: formData.location,
        coordinates: dbCoordinates,
        // Store dimensions and weight in the measurements JSONB field
        measurements: measurementsWithDimensions,
        user_id: user.id,
      };

      let result;

      if (isEditing) {
        result = await supabase
          .from("items")
          .update(postData)
          .eq("id", initialData.id);
      } else {
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
    uploadProgress,
    handleImageUpload,
    handleImagesChange,
    handleMeasurementChange,
    handleSubmit,
  };
}
