/**
 * EXIF orientation normalization.
 *
 * Many phone cameras store the photo in its raw sensor orientation and
 * indicate the intended display rotation via an EXIF "Orientation" tag.
 * Browsers honour that tag when rendering an <img>, but a <canvas> drawn
 * from the raw image — which is what react-easy-crop and our cropper use —
 * does NOT, so the crop preview and the cropped output end up rotated or
 * mirrored relative to what the user expects.
 *
 * To fix this once for the entire pipeline we normalize every newly
 * selected file: decode it with the browser honouring EXIF, re-encode it
 * upright as JPEG, and hand the corrected File to the crop / upload flow.
 */

const NORMALIZED_FLAG = "__pifOrientationNormalized";

export async function normalizeImageOrientation(file: File): Promise<File> {
  // Only raster photos can carry EXIF orientation that matters here.
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if ((file as any)[NORMALIZED_FLAG]) return file;

  try {
    // createImageBitmap with imageOrientation: 'from-image' applies the
    // EXIF rotation/flip while decoding. Supported in all modern browsers.
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
    } catch {
      // Fallback: decode without the option (older browsers). The image
      // will at least be drawable; orientation may not be corrected, but
      // we still return the original file in that case below.
      bitmap = await createImageBitmap(file);
    }

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    const normalized = new File([blob], newName, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
    try {
      Object.defineProperty(normalized, NORMALIZED_FLAG, { value: true });
    } catch {
      /* no-op */
    }
    return normalized;
  } catch (err) {
    console.warn("EXIF orientation normalization failed:", err);
    return file;
  }
}

export async function normalizeImageOrientationMany(files: File[]): Promise<File[]> {
  return Promise.all(files.map(normalizeImageOrientation));
}
