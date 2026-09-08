import { createImage } from "./cropping";

/**
 * Trello C4. Rotates an image file by a multiple of 90 degrees (positive =
 * clockwise), re-encoding it via canvas. Genuinely transforms the pixels --
 * unlike PostImageCropDialog's preview-frame selection, which deliberately
 * never touches the original file -- because a sideways/upside-down photo
 * needs the STORED image fixed, not just its thumbnail framing: the full
 * original is what a viewer sees when they open the lightbox.
 *
 * For a 90/270 rotation the output canvas swaps width/height to match the
 * rotated content; 180 keeps the same dimensions.
 */
export async function rotateImage(
  file: File,
  degrees: 90 | -90 | 180 | 270,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await createImage(url);
    const normalized = ((degrees % 360) + 360) % 360; // -90 -> 270, etc.
    const swapDimensions = normalized === 90 || normalized === 270;

    const canvas = document.createElement("canvas");
    canvas.width = swapDimensions ? image.naturalHeight : image.naturalWidth;
    canvas.height = swapDimensions ? image.naturalWidth : image.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");

    // Rotate around the canvas center, then draw the image centered on
    // itself -- simplest way to get correct positioning regardless of
    // whether width/height swapped.
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((normalized * Math.PI) / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    return await new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          resolve(
            new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            }),
          );
        },
        "image/jpeg",
        0.9,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
