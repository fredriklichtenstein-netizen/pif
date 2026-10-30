import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { normalizeImageOrientation, rotateImage, getCroppedImg } from "@/utils/image";
import type { ImageCrop } from "@/types/post";

/**
 * Pre-upload rotate/trim + preview-frame queue (Trello C4).
 *
 * Each newly selected file goes through two SEQUENTIAL phases, tracked by
 * `phase`:
 *
 * 1. 'trim' (PostImageTrimDialog) -- optional, freeform. Rotate and trim
 *    both genuinely re-encode the file (rotateImage / getCroppedImg -- the
 *    same canvas-crop utility the avatar flow already uses), because
 *    fixing a sideways photo or removing an unwanted edge needs the
 *    STORED image changed, not just its thumbnail framing: the full
 *    original is what a viewer sees in the lightbox. handleRotate updates
 *    the current queue slot in place (still mid-trim-phase, same image).
 *    handleTrimApply is terminal for THIS PHASE -- once applied, it also
 *    replaces the queue slot and advances to the 'preview' phase for the
 *    SAME image. handleTrimSkip just advances phase without touching the
 *    file (any rotation already applied stays -- that's not staged).
 *
 * 2. 'preview' (PostImageCropDialog) -- the original square preview-frame
 *    picker, unchanged: never alters the file, only records which region
 *    (as fractions) should frame the feed/card thumbnail. Save/Skip here
 *    push the (possibly rotated/trimmed) file to the results and advance
 *    to the NEXT image, which resets phase back to 'trim'.
 *
 * These were originally one merged step sharing a single square-only crop
 * selection -- confirmed via user testing that this was poor UX (forced a
 * square-shaped trim, conflated "cut this permanently" with "frame the
 * thumbnail" as the same choice). Splitting them into sequential phases
 * needed no changes to the wizard's own step array/navigation -- this is
 * still all happening inside the single "images" wizard step, just with
 * two sub-phases per image within it.
 *
 * After the queue is drained, the final files and their parallel crop
 * array are forwarded to `onImageUpload` together, in their original order.
 *
 * Only a SINGLE selected file goes through the dialogs. Several files at
 * once are added straight away with the default preview area; any added
 * image can then be run through the same two phases via `editExisting`,
 * which reports back through `onImageReplace` (with a null file when
 * only the preview area changed, so nothing is re-uploaded).
 */
export function useImageCropQueue(
  onImageUpload: (files: File[], crops: (ImageCrop | null)[]) => void,
  onImageReplace?: (index: number, file: File | null, crop: ImageCrop | null) => void,
) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [queue, setQueue] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<'trim' | 'preview'>('trim');
  const [isRotating, setIsRotating] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const resultsRef = useRef<File[]>([]);
  const cropsRef = useRef<(ImageCrop | null)[]>([]);
  const objectUrlsRef = useRef<string[]>([]);
  // Set while editing an already-added image rather than adding new ones.
  const [editTarget, setEditTarget] = useState<{ index: number; crop: ImageCrop | null } | null>(null);
  const editModifiedRef = useRef(false);

  const cleanup = useCallback(() => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    resultsRef.current = [];
    cropsRef.current = [];
    setQueue([]);
    setCurrentIndex(0);
    setCurrentUrl(null);
    setPhase('trim');
    setEditTarget(null);
    editModifiedRef.current = false;
  }, []);

  const flush = useCallback(() => {
    const finalFiles = resultsRef.current;
    const finalCrops = cropsRef.current;
    if (editTarget) {
      if (finalFiles.length > 0) {
        onImageReplace?.(
          editTarget.index,
          editModifiedRef.current ? finalFiles[0] : null,
          finalCrops[0] ?? null,
        );
      }
    } else if (finalFiles.length > 0) {
      onImageUpload(finalFiles, finalCrops);
    }
    cleanup();
  }, [onImageUpload, onImageReplace, editTarget, cleanup]);

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
      setPhase('trim'); // every new image starts at the rotate/trim phase
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
      // Several at once: added as-is with the default preview area
      // (usePostImageUpload normalizes orientation itself).
      if (rawFiles.length > 1) {
        onImageUpload(rawFiles, rawFiles.map(() => null));
        return;
      }
      const files = await Promise.all(rawFiles.map(normalizeImageOrientation));
      resultsRef.current = [];
      cropsRef.current = [];
      setEditTarget(null);
      setQueue(files);
      advance(0, files);
    },
    [advance, onImageUpload]
  );

  /** Opens an already-added image (by its uploaded URL) in the same
   *  rotate/trim -> preview-area phases. */
  const editExisting = useCallback(
    async (index: number, url: string, crop: ImageCrop | null) => {
      if (!onImageReplace) return;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const name = url.split("/").pop()?.split("?")[0] || "image";
        const file = new File([blob], name, { type: blob.type || "image/webp" });
        resultsRef.current = [];
        cropsRef.current = [];
        editModifiedRef.current = false;
        setEditTarget({ index, crop });
        setQueue([file]);
        advance(0, [file]);
      } catch (err) {
        console.error("Could not open image for editing:", err);
        toast({
          title: t("post.error", { defaultValue: "Fel" }),
          description: t("post.edit_image_error", { defaultValue: "Kunde inte öppna bilden. Försök igen." }),
          variant: "destructive",
        });
      }
    },
    [advance, onImageReplace, t, toast]
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
        editModifiedRef.current = true;
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

  /** Applies a freeform trim (natural-image pixel coordinates, already
   *  scaled by the caller -- see PostImageTrimDialog). Replaces the
   *  current queue slot, same as handleRotate, then advances THIS image
   *  to the 'preview' phase rather than pushing to results -- the square
   *  preview-frame step still runs on the (now-trimmed) result. */
  const handleTrimApply = useCallback(
    async (pixelCrop: { x: number; y: number; width: number; height: number }) => {
      const source = currentUrl;
      if (!source || isTrimming) return;
      setIsTrimming(true);
      try {
        const trimmed = await getCroppedImg(source, pixelCrop);
        if (!trimmed) throw new Error("getCroppedImg returned null");
        editModifiedRef.current = true;
        setQueue((q) => {
          const next = [...q];
          next[currentIndex] = trimmed;
          return next;
        });
        const url = URL.createObjectURL(trimmed);
        objectUrlsRef.current.push(url);
        setCurrentUrl(url);
        setPhase('preview');
      } catch (err) {
        console.error("Trim failed:", err);
        toast({
          title: t("post.error", { defaultValue: "Fel" }),
          description: t("post.trim_error", { defaultValue: "Kunde inte beskära bilden. Försök igen." }),
          variant: "destructive",
        });
      } finally {
        setIsTrimming(false);
      }
    },
    [currentUrl, isTrimming, currentIndex, t, toast],
  );

  const handleTrimSkip = useCallback(() => {
    setPhase('preview');
  }, []);

  return {
    handleImageUpload,
    cropImage: currentUrl,
    cropProgress:
      queue.length > 0 ? { current: currentIndex + 1, total: queue.length } : null,
    phase,
    handleRotate,
    isRotating,
    handleTrimApply,
    handleTrimSkip,
    isTrimming,
    handleCropSave,
    handleCropSkip,
    handleCancelAll,
    editExisting,
    // The saved preview area is only meaningful while the image itself is
    // unchanged; after a rotate/trim the picker starts from the default.
    initialCrop: editTarget && !editModifiedRef.current ? editTarget.crop : null,
  };
}
