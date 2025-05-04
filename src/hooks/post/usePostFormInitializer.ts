
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
  const measurements = initialData.measurements || {};
  
  // Extract dimension values from measurements if they exist
  const dimensions = {
    width: measurements.width || "",
    height: measurements.height || "",
    depth: measurements.depth || "",
  };
  
  // Extract weight from measurements
  const weight = measurements.weight || "";

  // Only use fields that exist in the type
  return {
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "",
    condition: initialData.condition || "",
    images: initialData.images || [],
    location: initialData.location || "",
    coordinates: coordinates,
    dimensions: dimensions,
    weight: weight,
    measurements: measurements,
  };
}
