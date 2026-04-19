import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

const SWIPE_THRESHOLD = 50;

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
  alt = "",
}: ImageLightboxProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Sync index when reopened.
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation + Escape close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && images.length > 1) goNext();
      else if (e.key === "ArrowLeft" && images.length > 1) goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev, images.length]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(delta) < SWIPE_THRESHOLD || images.length <= 1) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t("interactions.image_viewer", "Image viewer")}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors"
        aria-label={t("interactions.close", "Close")}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Position indicator (e.g. "2/4") */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white font-medium">
          {index + 1}/{images.length}
        </div>
      )}

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 transition-colors"
          aria-label={t("interactions.previous_image")}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image area */}
      <div
        className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[index]}
          alt={alt}
          className="max-w-[95vw] max-h-[90vh] object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 transition-colors"
          aria-label={t("interactions.next_image")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i === index ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`${t("interactions.go_to_image", "Go to image")} ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
