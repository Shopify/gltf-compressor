// This code is identical to the code in compress.worker.ts except it has all the types removed
const workerCode = `
self.addEventListener('message', async (event) => {
  const { id, imageData, maxResolution, mimeType, quality } = event.data;

  try {
    const compressedData = await compressImageInWorker(
      imageData,
      mimeType,
      maxResolution,
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
  mimeType,
  maxResolution,
  quality
) {
  if (!image || image.length === 0) {
    throw new Error("Invalid image data provided");
  }
  if (maxResolution <= 0) {
    throw new Error("Max resolution must be greater than 0");
  }
  if (quality < 0 || quality > 1) {
    throw new Error("Quality must be between 0 and 1");
  }

  const blob = new Blob([image]);
  const imageBitmap = await createImageBitmap(blob);

  try {
    const { width: originalWidth, height: originalHeight } = imageBitmap;
    const scale = Math.min(
      maxResolution / originalWidth,
      maxResolution / originalHeight,
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
      quality
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
