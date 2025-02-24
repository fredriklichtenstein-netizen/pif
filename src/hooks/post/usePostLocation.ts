
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CreatePostInput } from "@/types/post";

export const usePostLocation = (
  formData: CreatePostInput,
  setFormData: (data: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void
) => {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Since AddressInput now handles location validation internally,
  // we only need this minimal hook for state management
  return {
    isGeocoding,
  };
};
