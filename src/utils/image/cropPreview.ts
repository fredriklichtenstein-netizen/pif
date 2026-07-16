import type { CSSProperties } from "react";
import type { ImageCrop } from "@/types/post";

/**
 * CSS for rendering a stored preview-frame crop without altering the
 * underlying image file: the <img> is scaled up and repositioned inside an
 * `overflow-hidden` square container so the chosen region exactly fills it
 * (the classic "oversized positioned image" crop technique). The full
 * original image is always what's actually loaded — this only changes
 * which part of it is visible.
 *
 * With no crop (including every post that predates this feature, since
 * `image_crops` is null for those rows), falls back to a plain centered
 * `object-fit: cover` — the same default behavior shown before this
 * feature existed.
 */
export function getCropPreviewStyle(crop: ImageCrop | null | undefined): CSSProperties {
  if (!crop || !crop.width || !crop.height) {
    return {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      maxWidth: "none",
      objectFit: "cover",
      objectPosition: "center",
    };
  }

  const widthPct = 100 / crop.width;
  const heightPct = 100 / crop.height;
  const leftPct = -(crop.x / crop.width) * 100;
  const topPct = -(crop.y / crop.height) * 100;

  return {
    position: "absolute",
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    maxWidth: "none",
    objectFit: "cover",
  };
}
