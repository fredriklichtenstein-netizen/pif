
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook for handling image uploads for posts
 */
export function usePostImageUpload({ onImagesUploaded }: { onImagesUploaded: (urls: string[]) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const { t } = useTranslation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAnalyzing(true);
    setUploadProgress(0);
    const files = Array.from(e.target.files || []);

    if (!files || files.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      let completedUploads = 0;
      
      const uploadPromises = files.map(async (file) => {
        try {
          const timestamp = new Date().getTime();
          const filePath = `images/${user?.id}/${timestamp}-${file.name}`;

          const { error, data } = await supabase.storage
            .from("post-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error("Upload error:", error);
            toast({
              title: t('interactions.upload_error_title'),
              description: error.message,
              variant: "destructive",
            });
            return null;
          }

          completedUploads++;
          setUploadProgress(Math.round((completedUploads / files.length) * 100));
          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(filePath);
          return urlData.publicUrl;
        } catch (fileError) {
          console.error("File upload error:", fileError);
          toast({
            title: t('interactions.upload_failed'),
            description: t('interactions.upload_failed_description'),
            variant: "destructive",
          });
          return null;
        }
      });
      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      if (uploadedUrls.length > 0) {
        onImagesUploaded(uploadedUrls);
        toast({
          title: t('interactions.upload_successful'),
          description: t('interactions.upload_successful_description', { count: uploadedUrls.length }),
        });
      } else if (files.length > 0 && uploadedUrls.length === 0) {
        toast({
          title: t('interactions.upload_failed'),
          description: t('interactions.upload_none_succeeded'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unexpected error in image upload process:", error);
      toast({
        title: t('interactions.upload_failed'),
        description: t('interactions.upload_unexpected_error'),
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  return { handleImageUpload, isAnalyzing, uploadProgress };
}
