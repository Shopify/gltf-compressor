/**
 * This function compresses an image to a specified size, MIME type and quality
 * @param image - The image data to compress
 * @param maxDimension - The desired max width or height of the image (whichever is larger)
 * @param mimeType - The desired MIME type of the image
 * @param quality - The desired quality of the image (0-1)
 * @returns Promise<Uint8Array> - The compressed image data as a Uint8Array
 */
export const compressImage = async (
  image: Uint8Array,
  maxDimension: number,
  mimeType: string,
  quality: number
): Promise<Uint8Array> => {
  if (!image || image.length === 0) {
    throw new Error("Invalid image data provided");
  }
  if (maxDimension <= 0) {
    throw new Error("Max dimension must be greater than 0");
  }
  if (quality < 0 || quality > 1) {
    throw new Error("Quality must be between 0 and 1");
  }

  const blob = new Blob([image]);
  const blobUrl = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (error) =>
        reject(new Error(`Failed to load image: ${error}`));
      img.src = blobUrl;
    });

    const { width: originalWidth, height: originalHeight } = img;
    const scale = Math.min(
      maxDimension / originalWidth,
      maxDimension / originalHeight,
      1
    );
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    const imageData = await new Promise<Uint8Array>((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          try {
            const arrayBuffer = await blob.arrayBuffer();
            resolve(new Uint8Array(arrayBuffer));
          } catch (error) {
            reject(
              new Error(`Failed to convert blob to array buffer: ${error}`)
            );
          }
        },
        mimeType,
        quality
      );
    });

    return imageData;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};
