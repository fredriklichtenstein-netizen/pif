/**
 * Compress an image file: resize to a max dimension and convert to WEBP.
 * Falls back to the original file on any failure (e.g., HEIC/AVIF without decoder support).
 */
export interface CompressOptions {
  maxDimension?: number; // longest side in pixels
  quality?: number; // 0..1
  mimeType?: string; // output mime
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: 'image/webp',
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // Skip non-images and animated GIFs (resizing breaks animation)
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  const opts = { ...DEFAULTS, ...options };

  try {
    const dataUrl = await fileToDataUrl(file);
    const img = await loadImage(dataUrl);

    const { width, height } = img;
    const longest = Math.max(width, height);
    const scale = longest > opts.maxDimension ? opts.maxDimension / longest : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, opts.mimeType, opts.quality)
    );

    if (!blob) return file;

    // If the "compressed" output is larger than the original, keep the original
    if (blob.size >= file.size && scale === 1) {
      return file;
    }

    const ext = opts.mimeType === 'image/webp' ? 'webp' : opts.mimeType.split('/')[1] || 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, {
      type: opts.mimeType,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('Image compression failed, using original file:', err);
    return file;
  }
}
