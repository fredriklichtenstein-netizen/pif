import { useCallback, useRef, useState } from "react";
import { getCroppedImg, normalizeImageOrientation } from "@/utils/image";

/**
 * Pre-upload image cropping queue.
 *
 * Wraps the underlying `onImageUpload` (a file-input change handler) so that
 * every newly selected file is presented to the user in a crop dialog before
 * being passed to the actual upload handler. The user can either crop the
 * image (rectangular crop, free zoom) or skip cropping for that image. After
 * the queue is drained, the resulting Files (cropped or originals) are
 * forwarded to `onImageUpload` in their original order.
 */
export function useImageCropQueue(
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
) {
  const [queue, setQueue] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const resultsRef = useRef<File[]>([]);
  const objectUrlsRef = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    resultsRef.current = [];
    setQueue([]);
    setCurrentIndex(0);
    setCurrentUrl(null);
  }, []);

  const flush = useCallback(() => {
    const finalFiles = resultsRef.current;
    if (finalFiles.length > 0) {
      const dt = new DataTransfer();
      finalFiles.forEach((f) => dt.items.add(f));
      const synthetic = {
        target: { files: dt.files },
        currentTarget: { files: dt.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onImageUpload(synthetic);
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
      // Normalize EXIF orientation up-front so the crop preview and the
      // resulting cropped file are oriented the way the user expects.
      const files = await Promise.all(rawFiles.map(normalizeImageOrientation));
      resultsRef.current = [];
      setQueue(files);
      advance(0, files);
    },
    [advance]
  );

  const handleCropSave = useCallback(
    async (pixelCrop: { width: number; height: number; x: number; y: number }) => {
      if (!currentUrl) return;
      const original = queue[currentIndex];
      const cropped = await getCroppedImg(currentUrl, pixelCrop, "rect");
      const finalFile =
        cropped
          ? new File([cropped], original.name.replace(/\.[^.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          : original;
      resultsRef.current.push(finalFile);
      advance(currentIndex + 1, queue);
    },
    [advance, currentIndex, currentUrl, queue]
  );

  const handleCropSkip = useCallback(() => {
    const original = queue[currentIndex];
    if (original) resultsRef.current.push(original);
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
