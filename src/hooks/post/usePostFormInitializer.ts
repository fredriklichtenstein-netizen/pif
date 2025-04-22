
import { CreatePostInput } from "@/types/post";
import { parseCoordinates } from "@/utils/post/parseCoordinates";

const DEFAULT_FORM_DATA: CreatePostInput = {
  title: "",
  description: "",
  category: "",
  condition: "",
  images: [],
  location: "",
  coordinates: null,
  dimensions: {
    width: "",
    height: "",
    depth: "",
  },
  weight: "",
  measurements: {},
};

export function usePostFormInitializer(initialData?: any): CreatePostInput {
  if (!initialData) return { ...DEFAULT_FORM_DATA };

  const coordinates = parseCoordinates(initialData.coordinates);

  // Only use fields that exist in the type
  return {
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "",
    condition: initialData.condition || "",
    images: initialData.images || [],
    location: initialData.location || "",
    coordinates: coordinates,
    dimensions: {
      width: initialData.dimensions?.width || "",
      height: initialData.dimensions?.height || "",
      depth: initialData.dimensions?.depth || "",
    },
    weight: initialData.weight || "",
    measurements: initialData.measurements || {},
  };
}
