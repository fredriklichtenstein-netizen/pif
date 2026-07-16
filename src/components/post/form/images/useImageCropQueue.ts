import { useCallback, useRef, useState } from "react";
import { normalizeImageOrientation } from "@/utils/image";
import type { ImageCrop } from "@/types/post";

/**
 * Pre-upload preview-frame queue.
 *
 * Wraps the underlying `onImageUpload` so that every newly selected file is
 * presented to the user in a square preview-frame picker before being
 * passed to the actual upload handler. The image itself is never altered —
 * "Save" only records which square region (as fractions of the image)
 * should frame the feed/card thumbnail; "Skip" leaves that image with no
 * preference (null). After the queue is drained, the original (EXIF-
 * oriented) files and their parallel crop array are forwarded to
 * `onImageUpload` together, in their original order.
 */
export function useImageCropQueue(
  onImageUpload: (files: File[], crops: (ImageCrop | null)[]) => void
) {
  const [queue, setQueue] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const resultsRef = useRef<File[]>([]);
  const cropsRef = useRef<(ImageCrop | null)[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    resultsRef.current = [];
    cropsRef.current = [];
    setQueue([]);
    setCurrentIndex(0);
    setCurrentUrl(null);
  }, []);

  const flush = useCallback(() => {
    const finalFiles = resultsRef.current;
    const finalCrops = cropsRef.current;
    if (finalFiles.length > 0) {
      onImageUpload(finalFiles, finalCrops);
    }
    cleanup();
  }, [onImageUpload, cleanup]);

  const advance = useCallback(
    (nextIndex: number, files: File[]) => {
      if (nextIndex >= files.length) {
        flush();
        return;
      }
      const file = files[nextIndex];
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.push(url);
      setCurrentIndex(nextIndex);
      setCurrentUrl(url);
    },
    [flush]
  );

  /** Drop-in replacement for the underlying file-input change handler. */
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawFiles = Array.from(e.target.files || []);
      // Reset the input so selecting the same file again still fires change.
      try {
        if (e.target) (e.target as HTMLInputElement).value = "";
      } catch {
        /* no-op */
      }
      if (rawFiles.length === 0) return;
      // Normalize EXIF orientation up-front — once here, not again later —
      // so the preview-frame picker and the eventually-uploaded file agree
      // on orientation, and it isn't redundantly re-encoded a second time.
      const files = await Promise.all(rawFiles.map(normalizeImageOrientation));
      resultsRef.current = [];
      cropsRef.current = [];
      setQueue(files);
      advance(0, files);
    },
    [advance]
  );

  const handleCropSave = useCallback(
    (crop: ImageCrop) => {
      const original = queue[currentIndex];
      if (original) {
        resultsRef.current.push(original);
        cropsRef.current.push(crop);
      }
      advance(currentIndex + 1, queue);
    },
    [advance, currentIndex, queue]
  );

  const handleCropSkip = useCallback(() => {
    const original = queue[currentIndex];
    if (original) {
      resultsRef.current.push(original);
      cropsRef.current.push(null);
    }
    advance(currentIndex + 1, queue);
  }, [advance, currentIndex, queue]);

  const handleCancelAll = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    handleImageUpload,
    cropImage: currentUrl,
    cropProgress:
      queue.length > 0 ? { current: currentIndex + 1, total: queue.length } : null,
    handleCropSave,
    handleCropSkip,
    handleCancelAll,
  };
}
