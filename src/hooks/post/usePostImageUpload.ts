
import { useToast } from "@/hooks/use-toast";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { compressImage } from "@/utils/image/compress";
import { normalizeImageOrientation } from "@/utils/image/orientation";
import { sanitizeFilename } from "@/utils/sanitizeFilename";
import type { ImageCrop } from "@/types/post";

export interface UploadedImage {
  url: string;
  crop: ImageCrop | null;
}

/**
 * Hook for handling image uploads for posts. Each file carries its own
 * preview-frame crop (or null) as a pair, not a separately-indexed array —
 * Promise.all preserves input order here, but a failed upload is filtered
 * out, which would silently misalign a positionally-tracked crop array.
 * Pairing crop with file guarantees correct attribution regardless.
 */
export function usePostImageUpload({ onImagesUploaded }: { onImagesUploaded: (images: UploadedImage[]) => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  const { t } = useTranslation();

  const handleImageUpload = async (files: File[], crops: (ImageCrop | null)[] = []) => {
    setIsAnalyzing(true);
    setUploadProgress(0);

    if (!files || files.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      let completedUploads = 0;

      const uploadPromises = files.map(async (rawFile, index) => {
        const crop = crops[index] ?? null;
        try {
          // Normalize EXIF orientation, then compress to upright WEBP. The
          // full (uncropped) image is what's uploaded — `crop` is display
          // metadata only, recorded separately below.
          const oriented = await normalizeImageOrientation(rawFile);
          const file = await compressImage(oriented, { maxDimension: 1600, quality: 0.82 });
          const timestamp = new Date().getTime();
          const safeName = sanitizeFilename(file.name);
          const filePath = `images/${user?.id}/${timestamp}-${safeName}`;

          const { error, data } = await supabase.storage
            .from("post-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
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
          return { url: urlData.publicUrl, crop } satisfies UploadedImage;
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
      const uploaded = (await Promise.all(uploadPromises)).filter(
        (u): u is UploadedImage => u !== null
      );
      if (uploaded.length > 0) {
        onImagesUploaded(uploaded);
      } else if (files.length > 0 && uploaded.length === 0) {
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
