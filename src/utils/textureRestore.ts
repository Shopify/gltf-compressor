import { Texture } from "@gltf-transform/core";

/**
 * Asynchronously restores the original texture data to avoid blocking the main thread
 * Uses requestIdleCallback to perform the operation when the browser is idle
 */
export const restoreOriginalTextureAsync = (
  compressedTexture: Texture,
  originalTexture: Texture
): Promise<void> => {
  return new Promise((resolve) => {
    const originalImage = originalTexture.getImage();
    const originalMimeType = originalTexture.getMimeType();

    if (!originalImage || !originalMimeType) {
      resolve();
      return;
    }

    // Use requestIdleCallback if available, otherwise use setTimeout
    const scheduleRestore = (callback: () => void) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    };

    scheduleRestore(() => {
      // Perform the restoration in chunks to avoid blocking
      compressedTexture.setImage(originalImage);
      compressedTexture.setMimeType(originalMimeType);
      resolve();
    });
  });
};
