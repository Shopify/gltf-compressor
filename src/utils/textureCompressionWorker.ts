interface CompressionRequest {
  id: string;
  imageData: Uint8Array;
  mimeType: string;
  maxResolution: number;
  quality: number;
}

interface CompressionResponse {
  id: string;
  result?: Uint8Array;
  error?: string;
}

self.addEventListener(
  "message",
  async (event: MessageEvent<CompressionRequest>) => {
    const { id, imageData, mimeType, maxResolution, quality } = event.data;

    try {
      const compressedData = await compressImageInWorker(
        imageData,
        mimeType,
        maxResolution,
        quality
      );

      const response: CompressionResponse = {
        id,
        result: compressedData,
      };

      (self as unknown as DedicatedWorkerGlobalScope).postMessage(response, [
        compressedData.buffer,
      ]);
    } catch (error) {
      const response: CompressionResponse = {
        id,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };

      (self as unknown as DedicatedWorkerGlobalScope).postMessage(response);
    }
  }
);

async function compressImageInWorker(
  image: Uint8Array,
  mimeType: string,
  maxResolution: number,
  quality: number
): Promise<Uint8Array> {
  if (!image || image.length === 0) {
    throw new Error("Invalid image data provided");
  }
  if (maxResolution <= 0) {
    throw new Error("Max resolution must be greater than 0");
  }
  if (quality < 0 || quality > 1) {
    throw new Error("Quality must be between 0 and 1");
  }

  const blob = new Blob([image as BlobPart]);
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

    const compressedBlob = await canvas.convertToBlob({
      type: mimeType,
      quality,
    });

    const arrayBuffer = await compressedBlob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } finally {
    imageBitmap.close();
  }
}
