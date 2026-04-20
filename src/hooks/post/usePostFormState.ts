
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { PostFormData } from "@/types/post";

export function usePostFormState(initialData?: any) {
  const [searchParams] = useSearchParams();
  // Allow Feed buttons / deep links to preselect the post type via ?type=offer | ?type=request.
  const queryType = searchParams.get("type");
  const initialItemType: "offer" | "request" =
    initialData?.item_type ??
    (queryType === "request" || queryType === "offer" ? queryType : "offer");

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    condition: initialData?.condition || "",
    item_type: initialItemType,
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
