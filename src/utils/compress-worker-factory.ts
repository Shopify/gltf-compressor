// Worker code as a string to create blob URL
const workerCode = `
self.addEventListener('message', async (event) => {
  const { id, imageData, maxDimension, mimeType, quality } = event.data;

  try {
    const compressedData = await compressImageInWorker(
      imageData,
      maxDimension,
      mimeType,
      quality
    );

    const response = {
      id,
      result: compressedData
    };

    self.postMessage(response, [compressedData.buffer]);
  } catch (error) {
    const response = {
      id,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    self.postMessage(response);
  }
});

async function compressImageInWorker(
  image,
  maxDimension,
  mimeType,
  quality
) {
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
  const imageBitmap = await createImageBitmap(blob);

  try {
    const { width: originalWidth, height: originalHeight } = imageBitmap;
    const scale = Math.min(
      maxDimension / originalWidth,
      maxDimension / originalHeight,
      1
    );
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);

    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality
    });

    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } finally {
    imageBitmap.close();
  }
}
`;

export function createCompressionWorker(): Worker {
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
}
