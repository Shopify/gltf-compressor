import { Texture } from "@gltf-transform/core";

export function generateMaxDimensionOptions(maxDim: number): string[] {
  const options = [maxDim.toString()];
  const standardSizes = [8192, 4096, 2048, 1024, 512, 256, 128];

  for (const size of standardSizes) {
    if (size < maxDim) {
      options.push(size.toString());
    }
  }

  return options;
}

export function formatSize(sizeInKB: number): string {
  if (sizeInKB >= 1000) {
    return `${(sizeInKB / 1000).toFixed(1)} MB`;
  }
  return `${sizeInKB.toFixed(1)} KB`;
}

export function calculateTextureWeight(
  texture: Texture | null | undefined
): number {
  if (!texture) return 0;

  const imageData = texture.getImage();
  if (!imageData?.byteLength) return 0;

  // Return weight in kilobytes
  return imageData.byteLength / 1000;
}
