import { Texture } from "@gltf-transform/core";

import { KTX2Options, TextureCompressionSettings } from "@/types/types";

import { decodeKTX2ToPNG, getKTX2Info } from "./ktxUtils";
import TextureCompressionWorker from "./textureCompressionWorker?worker&inline";

let compressionWorker: Worker | null = null;
let requestIdCounter = 0;
const pendingRequests = new Map<
  string,
  {
    resolve: (value: Uint8Array) => void;
    reject: (error: Error) => void;
  }
>();

const getOrCreateWorker = (): Worker => {
  if (!compressionWorker) {
    compressionWorker = new TextureCompressionWorker();

    compressionWorker.addEventListener("message", (event) => {
      const { id, result, error } = event.data;
      const pending = pendingRequests.get(id);

      if (pending) {
        pendingRequests.delete(id);

        if (error) {
          pending.reject(new Error(error));
        } else if (result) {
          pending.resolve(result);
        }
      }
    });

    compressionWorker.addEventListener("error", (error) => {
      console.error("Worker error:", error);
      pendingRequests.forEach((pending) => {
        pending.reject(new Error("Worker error occurred"));
      });
      pendingRequests.clear();
    });
  }

  return compressionWorker;
};

/**
 * This function compresses an image to a specified MIME type, resolution, and quality
 * @param image - The image data to compress
 * @param mimeType - The desired MIME type of the image
 * @param maxResolution - The desired max width or height of the image (whichever is larger)
 * @param quality - The desired quality of the image (0-1)
 * @param ktx2Options - The KTX2 options to use for the compression (optional)
 * @returns Promise<Uint8Array> - The compressed image data as a Uint8Array
 */
const compressImage = async (
  image: Uint8Array,
  mimeType: string,
  maxResolution: number,
  quality: number,
  ktx2Options?: KTX2Options
): Promise<Uint8Array> => {
  const requestId = `req_${++requestIdCounter}`;
  const worker = getOrCreateWorker();

  return new Promise<Uint8Array>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    const imageDataCopy = image.slice();

    worker.postMessage(
      {
        id: requestId,
        imageData: imageDataCopy,
        mimeType,
        maxResolution,
        quality,
        ktx2Options,
      },
      [imageDataCopy.buffer]
    );
  });
};

export interface CompressionResult {
  warning?: string;
}

export const compressTexture = async (
  originalTexture: Texture,
  compressionSettings: TextureCompressionSettings
): Promise<CompressionResult> => {
  const mimeType = compressionSettings.mimeType || "image/jpeg";
  const originalMimeType = originalTexture.getMimeType();
  let sourceImage = originalTexture.getImage()!;
  let warning: string | undefined;

  // If the source is KTX2, decode it first since createImageBitmap can't handle KTX2
  if (originalMimeType === "image/ktx2") {
    const size = originalTexture.getSize();
    if (size) {
      const ktx2Info = getKTX2Info(sourceImage);

      // Warn if converting HDR to HDR (quality loss through 8-bit decode)
      if (ktx2Info.isHDR) {
        const targetIsHDR =
          mimeType === "image/ktx2" &&
          compressionSettings.ktx2Options?.outputType === "UASTC_HDR";
        if (targetIsHDR) {
          warning =
            "Converting HDR KTX2 to HDR KTX2 will lose precision (decoded through 8-bit)";
        }
      }

      // Warn about mipmap regeneration
      if (ktx2Info.mipLevels > 1) {
        const mipWarning = `Source has ${ktx2Info.mipLevels} mip levels that will be lost or regenerated`;
        warning = warning ? `${warning}. ${mipWarning}` : mipWarning;
      }

      sourceImage = await decodeKTX2ToPNG(sourceImage, size[0], size[1]);
    }
  }

  const compressedImageData = await compressImage(
    sourceImage,
    mimeType,
    compressionSettings.maxResolution,
    compressionSettings.quality,
    mimeType === "image/ktx2" ? compressionSettings.ktx2Options : undefined
  );
  if (compressionSettings.compressedTexture) {
    compressionSettings.compressedTexture!.setMimeType(mimeType);
    compressionSettings.compressedTexture!.setImage(compressedImageData);
  }

  return { warning };
};
