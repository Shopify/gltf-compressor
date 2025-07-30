import { Texture } from "@gltf-transform/core";

import { TextureCompressionSettings } from "@/types/types";

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
 * @returns Promise<Uint8Array> - The compressed image data as a Uint8Array
 */
const compressImage = async (
  image: Uint8Array,
  mimeType: string,
  maxResolution: number,
  quality: number
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
      },
      [imageDataCopy.buffer]
    );
  });
};

export const compressTexture = async (
  originalTexture: Texture,
  compressionSettings: TextureCompressionSettings
) => {
  const mimeType = compressionSettings.mimeType || "image/jpeg";
  const compressedImageData = await compressImage(
    originalTexture.getImage()!,
    mimeType,
    compressionSettings.maxResolution,
    compressionSettings.quality
  );
  if (compressionSettings.compressedTexture) {
    compressionSettings.compressedTexture!.setImage(compressedImageData);
    compressionSettings.compressedTexture!.setMimeType(mimeType);
  }
};
