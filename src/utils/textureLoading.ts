import { Texture } from "@gltf-transform/core";
import { RefObject } from "react";
import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { TextureCompressionSettings } from "@/types/types";

let currentLoadId = 0;
let activeLoadId = 0;

export const loadTexture = (
  selectedTexture: Texture,
  textureCompressionSettingsMap: Map<Texture, TextureCompressionSettings>,
  showModifiedDocument: boolean,
  canvas: HTMLCanvasElement,
  offscreenCanvas: HTMLCanvasElement,
  ktx2LoaderRef: RefObject<KTX2Loader | null>
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // Generate a unique ID for this load operation
    const loadId = ++currentLoadId;
    activeLoadId = loadId;

    // Helper function to check if this load is still active
    const isLoadActive = () => activeLoadId === loadId;

    // Get the context of the visible canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve();
      return;
    }

    // Get the context of the off-screen canvas
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) {
      resolve();
      return;
    }

    // Show compressed texture if compression is enabled and the texture is available, otherwise show original
    const textureCompressionSettings =
      textureCompressionSettingsMap.get(selectedTexture);
    const texture =
      textureCompressionSettings?.compressionEnabled &&
      textureCompressionSettings?.compressedTexture &&
      showModifiedDocument
        ? textureCompressionSettings.compressedTexture
        : selectedTexture;
    if (!texture) {
      resolve();
      return;
    }

    // Get the texture's data
    const imageData = texture.getImage();
    const mimeType = texture.getMimeType();
    const resolution = texture.getSize();
    if (!imageData || !resolution) {
      resolve();
      return;
    }

    // Update the off-screen canvas' size to match the texture's resolution
    offscreenCanvas.width = resolution[0];
    offscreenCanvas.height = resolution[1];

    if (mimeType === "image/ktx2") {
      // Handle KTX2 textures
      try {
        // Create a temporary canvas with a WebGL context
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = resolution[0];
        tempCanvas.height = resolution[1];
        const renderer = new WebGLRenderer({ canvas: tempCanvas });

        // Create or reuse KTX2Loader
        if (!ktx2LoaderRef.current) {
          ktx2LoaderRef.current = new KTX2Loader();
          ktx2LoaderRef.current.setTranscoderPath(
            "https://unpkg.com/three@0.178.0/examples/jsm/libs/basis/"
          );
          ktx2LoaderRef.current.detectSupport(renderer);
        }

        // Create a blob from the texture's data
        const blob = new Blob([imageData as BlobPart], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // Load the KTX2 texture into a Three.js texture
        ktx2LoaderRef.current.load(
          blobUrl,
          (threeTexture) => {
            // Check if this load is still active
            if (!isLoadActive()) {
              renderer.dispose();
              URL.revokeObjectURL(blobUrl);
              return;
            }

            // Render the texture on a plane using an orthographic camera
            threeTexture.colorSpace = SRGBColorSpace;
            const scene = new Scene();
            const aspectRatio = resolution[0] / resolution[1];
            const camera = new OrthographicCamera(
              -1 * aspectRatio,
              aspectRatio,
              1,
              -1,
              0,
              1
            );
            const geometry = new PlaneGeometry(2 * aspectRatio, 2);
            const material = new MeshBasicMaterial({
              map: threeTexture,
            });
            const mesh = new Mesh(geometry, material);
            scene.add(mesh);
            renderer.render(scene, camera);

            // Convert the rendered texture to a data URL
            const renderedImageData = renderer.domElement.toDataURL();

            const img = new Image();
            img.onload = () => {
              // Check if this load is still active
              if (!isLoadActive()) {
                renderer.dispose();
                URL.revokeObjectURL(blobUrl);
                resolve();
                return;
              }

              // Clear the off-screen canvas and draw the texture on it
              offscreenCtx.clearRect(
                0,
                0,
                offscreenCanvas.width,
                offscreenCanvas.height
              );
              offscreenCtx.save();
              // Flip the image vertically by scaling Y by -1
              offscreenCtx.scale(1, -1);
              offscreenCtx.drawImage(img, 0, -offscreenCanvas.height);
              offscreenCtx.restore();

              // Swap from the off-screen canvas to the visible canvas after the texture is fully loaded
              // This prevents a visible flicker in the UI
              canvas.width = resolution[0];
              canvas.height = resolution[1];
              ctx.drawImage(offscreenCanvas, 0, 0);

              renderer.dispose();
              URL.revokeObjectURL(blobUrl);
              resolve();
            };
            img.src = renderedImageData;
          },
          undefined,
          (error) => {
            console.error("Failed to load KTX2 texture: ", error);
            renderer.dispose();
            URL.revokeObjectURL(blobUrl);
            reject(error);
          }
        );
      } catch (error) {
        console.error("Failed to load KTX2 texture: ", error);
        reject(error);
      }
    } else {
      // Handle regular textures (JPEG, PNG, WebP)
      const blob = new Blob([imageData as BlobPart], {
        type: mimeType,
      });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        // Check if this load is still active
        if (!isLoadActive()) {
          URL.revokeObjectURL(blobUrl);
          resolve();
          return;
        }

        // Clear the off-screen canvas and draw the texture on it
        offscreenCtx.clearRect(
          0,
          0,
          offscreenCanvas.width,
          offscreenCanvas.height
        );
        offscreenCtx.drawImage(img, 0, 0);

        // Swap from the off-screen canvas to the visible canvas after the texture is fully loaded
        // This prevents a visible flicker in the UI
        canvas.width = resolution[0];
        canvas.height = resolution[1];
        ctx.drawImage(offscreenCanvas, 0, 0);

        URL.revokeObjectURL(blobUrl);
        resolve();
      };
      img.onerror = (e) => {
        console.error("Failed to load texture: ", e);
        URL.revokeObjectURL(blobUrl);
        reject(e);
      };
      img.src = blobUrl;
    }
  });
};

export const restoreOriginalTexture = (
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
