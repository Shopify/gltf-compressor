import { encodeToKTX2 } from "ktx2-encoder";

import { defaultKTX2Options, type KTX2Options } from "@/types/types";

interface CompressionRequest {
  id: string;
  imageData: Uint8Array;
  mimeType: string;
  maxResolution: number;
  quality: number;
  ktx2Options?: KTX2Options;
}

interface CompressionResponse {
  id: string;
  result?: Uint8Array;
  error?: string;
}

self.addEventListener(
  "message",
  async (event: MessageEvent<CompressionRequest>) => {
    const { id, imageData, mimeType, maxResolution, quality, ktx2Options } =
      event.data;

    try {
      const compressedData = await compressImageInWorker(
        imageData,
        mimeType,
        maxResolution,
        quality,
        ktx2Options
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
  quality: number,
  ktx2Options: KTX2Options = defaultKTX2Options
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

    if (mimeType === "image/ktx2") {
      const pngBlob = await canvas.convertToBlob({ type: "image/png" });
      const pngArrayBuffer = await pngBlob.arrayBuffer();
      const pngData = new Uint8Array(pngArrayBuffer);

      const isHDR = ktx2Options.outputType === "UASTC_HDR";
      const isUASTC =
        ktx2Options.outputType === "UASTC" ||
        ktx2Options.outputType === "UASTC_HDR";

      const baseOptions = {
        isUASTC,
        generateMipmap: ktx2Options.generateMipmaps,
        isNormalMap: ktx2Options.isNormalMap,
        isSetKTX2SRGBTransferFunc: ktx2Options.srgbTransferFunction,
        needSupercompression: ktx2Options.enableSupercompression,
        enableRDO: ktx2Options.enableRDO,
        rdoQualityLevel: ktx2Options.rdoQualityLevel,
        qualityLevel: Math.round(quality * 255),
        jsUrl: new URL("/basis/basis_encoder.js", self.location.origin).href,
        wasmUrl: new URL("/basis/basis_encoder.wasm", self.location.origin)
          .href,
      };

      const ktx2Data: Uint8Array = await encodeToKTX2(
        pngData,
        isHDR
          ? {
              ...baseOptions,
              isHDR: true as const,
              imageType: "raster" as const,
            }
          : { ...baseOptions, isHDR: false as const }
      );

      return ktx2Data;
    }

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
