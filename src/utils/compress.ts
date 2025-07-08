/**
 * Compresses an image to a specified MIME type and quality
 * @param image - The image data to compress
 * @param maxDimension - The max width or height of the image (whichever is larger)
 * @param mimeType - The MIME type of the image
 * @param quality - The quality of the image (0-1)
 * @returns Promise<Uint8Array> - The compressed image data as a Uint8Array
 */
export const compressImage = async (
  image: Uint8Array,
  maxDimension: number,
  mimeType: string,
  quality?: number
): Promise<Uint8Array> => {
  const blob = new Blob([image]);
  const blobUrl = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = (e) => reject(console.log(e));
    img.src = blobUrl;
  });

  // Calculate dimensions while preserving aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > height && width > maxDimension) {
    height = (height / width) * maxDimension;
    width = maxDimension;
  } else if (height > width && height > maxDimension) {
    width = (width / height) * maxDimension;
    height = maxDimension;
  } else if (width === height && width > maxDimension) {
    width = maxDimension;
    height = maxDimension;
  }

  // Create resized canvas with proper dimensions
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = await new Promise<Uint8Array>((resolve) => {
    canvas.toBlob(
      async (blob) => {
        const arrayBuffer = await blob!.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      },
      mimeType,
      quality
    );
  });

  URL.revokeObjectURL(blobUrl);

  return imageData;
};
