
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useState } from "react";

/**
 * Hook for handling image uploads for posts
 */
export function usePostImageUpload({ onImagesUploaded }: { onImagesUploaded: (urls: string[]) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  // Handles uploading images and returns URLs
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
      onImagesUploaded(uploadedUrls);
    }

    setIsAnalyzing(false);
  };

  return { handleImageUpload, isAnalyzing };
}
