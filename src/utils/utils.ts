import { defaultTextureQuality } from "@/constants";
import { TextureCompressionSettings } from "@/types";
import { Document, Texture } from "@gltf-transform/core";

export function buildTextureCompressionSettingsMap(
  document: Document,
  modifiedDocument: Document
): Map<Texture, TextureCompressionSettings> {
  const textureCompressionSettingsMap = new Map<
    Texture,
    TextureCompressionSettings
  >();

  const textures = document.getRoot().listTextures();

  const modifiedTextures = modifiedDocument.getRoot().listTextures();

  textures.forEach((texture, index) => {
    const size = texture.getSize() ?? [0, 0];
    const maxDimension = Math.max(size[0], size[1]);

    const textureCompressionSettings: TextureCompressionSettings = {
      compressedTexture: modifiedTextures[index],
      mimeType: texture.getMimeType(),
      quality: defaultTextureQuality,
      compressionEnabled: false,
      maxDimension: maxDimension,
    };
    textureCompressionSettingsMap.set(texture, textureCompressionSettings);
  });

  return textureCompressionSettingsMap;
}

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

/**
 * Calculates the weight of a texture's image data in kilobytes
 * @param texture The texture to calculate weight for
 * @returns The weight in kilobytes, or 0 if no image data is available
 */
export function calculateTextureWeight(
  texture: Texture | null | undefined
): number {
  if (!texture) return 0;

  const imageData = texture.getImage();
  if (!imageData?.byteLength) return 0;

  return imageData.byteLength / 1000;
}
