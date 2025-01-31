/**
 * Compresses an image to a specified MIME type and quality
 * @param image - The imagedata to compress
 * @param maxDimension - The max height or width of the image (whichever is larger)
 * @param type - The MIME type of the image
 * @param quality - The quality of the image (0-1)
 * @returns Promise<Uint8Array> - The compressed imagedata as a Uint8Array
 */
export const compressImage = async (
  image: Uint8Array,
  maxDimension: number,
  type: string,
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

  // Create resized canvas
  const canvas = document.createElement("canvas");
  canvas.width = maxDimension;
  canvas.height = maxDimension;

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
      type,
      quality
    );
  });

  return imageData;
};
