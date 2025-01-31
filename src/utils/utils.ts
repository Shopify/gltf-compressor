import { defaultTextureQuality, textureMapNames } from "@/constants";
import {
  MaterialCompressionSettings,
  ModelCompressionSettings,
  TextureCompressionSettings,
} from "@/types";
import { Document, Texture } from "@gltf-transform/core";

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
 * Returns the first available texture according to the order in constants.ts
 * @param materialCompressionSettings The material compression settings to extract textures from
 * @returns The first available texture or null if no texture is found
 */
export function getFirstAvailableTextureName(
  materialCompressionSettings: MaterialCompressionSettings
): string | null {
  const name = textureMapNames.find((prop) => {
    const value = (materialCompressionSettings as any)[prop];
    return value?.original instanceof Texture;
  });

  return name ?? null;
}

export function buildTextureCompressionSettings(
  document: Document
): ModelCompressionSettings {
  const compressionSettings: ModelCompressionSettings = {
    materials: {},
  };

  const materials = document.getRoot().listMaterials();

  materials.forEach((material) => {
    const textureSettings: { [key: string]: TextureCompressionSettings } = {};
    let hasTextures = false;

    // Map gltf-transform texture getters to our texture property names
    const textureGetters = {
      baseColorTexture: material.getBaseColorTexture(),
      emissiveTexture: material.getEmissiveTexture(),
      metallicRoughnessTexture: material.getMetallicRoughnessTexture(),
      normalTexture: material.getNormalTexture(),
      occlusionTexture: material.getOcclusionTexture(),
    };

    // Check each texture type
    Object.entries(textureGetters).forEach(([propName, texture]) => {
      if (texture) {
        hasTextures = true;
        textureSettings[propName] = {
          original: texture,
          compressed: null,
          type: propName,
          quality: defaultTextureQuality,
          compressionEnabled: false,
        };
      }
    });

    if (hasTextures) {
      compressionSettings.materials[material.getName() || "unnamed"] =
        textureSettings;
    }
  });

  return compressionSettings;
}
