import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { normalizeImageOrientation, rotateImage } from "@/utils/image";
import type { ImageCrop } from "@/types/post";

/**
 * Pre-upload preview-frame (+ rotate, Trello C4) queue.
 *
 * Wraps the underlying `onImageUpload` so that every newly selected file is
 * presented to the user in a square preview-frame picker before being
 * passed to the actual upload handler. The preview-frame selection itself
 * never alters the image — "Save" only records which square region (as
 * fractions of the image) should frame the feed/card thumbnail; "Skip"
 * leaves that image with no preference (null).
 *
 * Rotation is different: it genuinely re-encodes the file (see
 * utils/image/rotation.ts), because a sideways photo needs the STORED
 * image fixed, not just its thumbnail framing — the full original is what
 * a viewer sees in the lightbox. handleRotate replaces the current queue
 * slot with the rotated file, so it's what both the crop-frame picker
 * operates on next AND what ultimately gets uploaded.
 *
 * After the queue is drained, the final (possibly-rotated, EXIF-oriented)
 * files and their parallel crop array are forwarded to `onImageUpload`
 * together, in their original order.
 */
export function useImageCropQueue(
  onImageUpload: (files: File[], crops: (ImageCrop | null)[]) => void
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [queue, setQueue] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
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

  const handleRotate = useCallback(
    async (direction: 1 | -1) => {
      const current = queue[currentIndex];
      if (!current || isRotating) return;
      setIsRotating(true);
      try {
        const rotated = await rotateImage(current, direction > 0 ? 90 : -90);
        setQueue((q) => {
          const next = [...q];
          next[currentIndex] = rotated;
          return next;
        });
        const url = URL.createObjectURL(rotated);
        objectUrlsRef.current.push(url);
        setCurrentUrl(url);
      } catch (err) {
        console.error("Rotate failed:", err);
        toast({
          title: t("post.error", { defaultValue: "Fel" }),
          description: t("post.rotate_error", { defaultValue: "Kunde inte rotera bilden. Försök igen." }),
          variant: "destructive",
        });
      } finally {
        setIsRotating(false);
      }
    },
    [queue, currentIndex, isRotating, t, toast],
  );

  return {
    handleImageUpload,
    cropImage: currentUrl,
    cropProgress:
      queue.length > 0 ? { current: currentIndex + 1, total: queue.length } : null,
    handleRotate,
    isRotating,
    handleCropSave,
    handleCropSkip,
    handleCancelAll,
  };
}
