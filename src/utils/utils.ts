import { defaultTextureQuality } from "@/constants";
import {
  MaterialCompressionSettings,
  ModelCompressionSettings,
  TextureCompressionSettings,
} from "@/types";
import {
  Document,
  ExtensionProperty,
  Material,
  Texture,
} from "@gltf-transform/core";

/**
 * Given model compression settings, returns an array of material names that have textures set
 * @param modelCompressionSettings The model compression settings to filter
 * @returns An array of material names that have textures set
 */
export function filterMaterialNamesWithTextures(
  modelCompressionSettings: ModelCompressionSettings
): string[] {
  return Object.keys(modelCompressionSettings.materials).filter(
    (materialName) =>
      getFirstAvailableTextureName(
        modelCompressionSettings.materials[materialName]
      )
  );
}

/**
 * Filters the material compression settings to only include maps that have textures
 * @param materialCompressionSettings The material compression settings to filter
 * @returns An object containing the maps that have textures
 */
export function filterMapNamesWithTextures(
  materialCompressionSettings: MaterialCompressionSettings
): string[] {
  return Object.keys(materialCompressionSettings);
}

/**
 * Returns the first available texture name from material compression settings
 * @param materialCompressionSettings The material compression settings to extract textures from
 * @returns The first available texture name or null if no texture is found
 */
export function getFirstAvailableTextureName(
  materialCompressionSettings: MaterialCompressionSettings
): string | null {
  const textureNames = Object.keys(materialCompressionSettings);
  return textureNames.length > 0 ? textureNames[0] : null;
}

export function buildTextureCompressionSettings(
  document: Document,
  modifiedDocument: Document
): ModelCompressionSettings {
  const compressionSettings: ModelCompressionSettings = {
    materials: {},
    textures: new Map(),
  };

  const textures = document.getRoot().listTextures();

  const modifiedTextures = modifiedDocument.getRoot().listTextures();

  textures.forEach((texture, index) => {
    const size = texture.getSize() ?? [0, 0];
    const maxDimension = Math.max(size[0], size[1]);

    const textureCompressionSettings: TextureCompressionSettings = {
      compressedTexture: modifiedTextures[index],
      compressedImageData: texture.getImage()?.slice() ?? null,
      mimeType: texture.getMimeType(),
      quality: defaultTextureQuality,
      compressionEnabled: false,
      maxDimension: maxDimension,
    };
    compressionSettings.textures.set(texture, textureCompressionSettings);
  });

  return compressionSettings;
}

export function getTexturesFromMaterial(
  material: Material
): { slot: string; texture: Texture }[] {
  const extensions = new Set<ExtensionProperty>(material.listExtensions());
  return material
    .getGraph()
    .listEdges()
    .filter((ref) => {
      const child = ref.getChild();
      const parent = ref.getParent();
      if (child instanceof Texture && parent === material) {
        return true;
      }
      if (
        child instanceof Texture &&
        parent instanceof ExtensionProperty &&
        extensions.has(parent)
      ) {
        return true;
      }
      return false;
    })
    .map((ref) => {
      return {
        slot: ref.getName() || "",
        texture: (ref.getChild() as Texture) || null,
      };
    });
}

export function getTextureSlotsFromMaterial(material: Material): string[] {
  return getTexturesFromMaterial(material).map(({ slot }) => slot);
}

export function getUniqueTexturesFromDocument(document: Document): Texture[] {
  const uniqueTextures = new Set<Texture>();

  document
    .getRoot()
    .listMaterials()
    .forEach((material) => {
      const materialTextures = getTexturesFromMaterial(material);

      materialTextures.forEach(({ texture }) => {
        uniqueTextures.add(texture);
      });
    });

  return Array.from(uniqueTextures);
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
