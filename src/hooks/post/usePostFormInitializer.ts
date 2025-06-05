
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
  item_type: "offer",
  measurements: {},
};

export function usePostFormInitializer(initialData?: any): CreatePostInput {
  if (!initialData) return { ...DEFAULT_FORM_DATA };

  const coordinates = parseCoordinates(initialData.coordinates);
  const measurements = initialData.measurements || {};

  return {
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "",
    condition: initialData.condition || "",
    images: initialData.images || [],
    location: initialData.location || "",
    coordinates: coordinates,
    item_type: initialData.item_type || "offer",
    measurements: measurements,
  };
}
