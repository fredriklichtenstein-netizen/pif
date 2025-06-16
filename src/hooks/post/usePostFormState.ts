
import { useState } from "react";
import type { PostFormData } from "@/types/post";

export function usePostFormState(initialData?: any) {
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

  const handleImagesChange = (images: string[]) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: images,
    }));
  };

  const handleMeasurementChange = (name: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      measurements: {
        ...prevFormData.measurements,
        [name]: value,
      },
    }));
  };

  return {
    formData,
    setFormData,
    handleImagesChange,
    handleMeasurementChange,
  };
}
