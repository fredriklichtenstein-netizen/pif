
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
    console.log("Image upload started");
    setIsAnalyzing(true);
    const files = Array.from(e.target.files || []);

    if (!files || files.length === 0) {
      console.log("No files selected");
      setIsAnalyzing(false);
      return;
    }

    try {
      console.log(`Processing ${files.length} files for upload`);
      const { supabase } = await import("@/integrations/supabase/client");
      
      const uploadPromises = files.map(async (file) => {
        try {
          console.log(`Uploading file: ${file.name}, size: ${file.size}`);
          const timestamp = new Date().getTime();
          const filePath = `images/${user?.id}/${timestamp}-${file.name}`;

          const { error, data } = await supabase.storage
            .from("lovable-uploads")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error("Upload error:", error);
            toast({
              title: "Error uploading image",
              description: error.message,
              variant: "destructive",
            });
            return null;
          }

          console.log(`File uploaded successfully: ${filePath}`);
          const { data: urlData } = supabase.storage
            .from("lovable-uploads")
            .getPublicUrl(filePath);
            
          console.log(`Generated public URL: ${urlData.publicUrl}`);
          return urlData.publicUrl;
        } catch (fileError) {
          console.error("File upload error:", fileError);
          toast({
            title: "Upload failed",
            description: "An error occurred while uploading the image",
            variant: "destructive",
          });
          return null;
        }
      });

      console.log("Waiting for all uploads to complete");
      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

      console.log(`Upload completed: ${uploadedUrls.length} successful uploads`);
      if (uploadedUrls.length > 0) {
        onImagesUploaded(uploadedUrls);
      } else if (files.length > 0 && uploadedUrls.length === 0) {
        toast({
          title: "Upload failed",
          description: "None of the images could be uploaded. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unexpected error in image upload process:", error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      console.log("Upload process finished, resetting state");
      setIsAnalyzing(false);
    }
  };

  return { handleImageUpload, isAnalyzing };
}
