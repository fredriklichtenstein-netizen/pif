
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Add this to handle CORS
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number }
): Promise<File | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set proper canvas dimensions
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw circular crop
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) / 2,
      0,
      2 * Math.PI,
      true
    );
    ctx.clip();

    // Draw the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert to blob with error handling
    return new Promise((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const file = new File([blob], 'cropped-profile.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          },
          'image/jpeg',
          1
        );
      } catch (err) {
        console.error('Canvas toBlob error:', err);
        resolve(null);
      }
    });
  } catch (err) {
    console.error('Image processing error:', err);
    return null;
  }
}

