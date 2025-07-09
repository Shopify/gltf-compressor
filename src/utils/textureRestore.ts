import { Texture } from "@gltf-transform/core";

/**
 * Asynchronously sets texture data to avoid blocking the main thread
 * Uses requestIdleCallback to perform the operation when the browser is idle
 */
export const setTextureDataAsync = (
  texture: Texture,
  imageData: Uint8Array,
  mimeType: string
): Promise<void> => {
  return new Promise((resolve) => {
    if (!imageData || !mimeType) {
      resolve();
      return;
    }

    // Use requestIdleCallback if available, otherwise use setTimeout
    const scheduleUpdate = (callback: () => void) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    };

    scheduleUpdate(() => {
      texture.setImage(imageData);
      texture.setMimeType(mimeType);
      resolve();
    });
  });
};

/**
 * Asynchronously restores the original texture data to avoid blocking the main thread
 * Uses requestIdleCallback to perform the operation when the browser is idle
 */
export const restoreOriginalTextureAsync = (
  compressedTexture: Texture,
  originalTexture: Texture
): Promise<void> => {
  const originalImage = originalTexture.getImage();
  const originalMimeType = originalTexture.getMimeType();
  
  if (!originalImage || !originalMimeType) {
    return Promise.resolve();
  }

  return setTextureDataAsync(compressedTexture, originalImage, originalMimeType);
};
