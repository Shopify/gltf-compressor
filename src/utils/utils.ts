import { defaultTextureQuality, GLTFTextureMapNames } from "@/constants";
import {
  GLTFMaterialCompressionSettings,
  GLTFModelCompressionSettings,
  GLTFTextureCompressionSettings,
} from "@/types";
import { Document, Texture as GLTFTexture } from "@gltf-transform/core";

/**
 * Given model compression settings, returns an array of material names that have textures set
 * @param modelCompressionSettings The model compression settings to filter
 * @returns An array of material names that have textures set
 */
export function filterGLTFMaterialNamesWithTextures(
  modelCompressionSettings: GLTFModelCompressionSettings
): string[] {
  return Object.keys(modelCompressionSettings.materials).filter(
    (materialName) =>
      getFirstAvailableGLTFTextureName(
        modelCompressionSettings.materials[materialName]
      )
  );
}

/**
 * Filters the material compression settings to only include maps that have textures
 * @param materialCompressionSettings The material compression settings to filter
 * @returns An object containing the maps that have textures
 */
export function filterGLTFMapNamesWithTextures(
  materialCompressionSettings: GLTFMaterialCompressionSettings
): string[] {
  return Object.keys(materialCompressionSettings);
}

/**
 * Returns the first available texture according to the order in constants.ts
 * @param materialCompressionSettings The material compression settings to extract textures from
 * @returns The first available texture or null if no texture is found
 */
export function getFirstAvailableGLTFTextureName(
  materialCompressionSettings: GLTFMaterialCompressionSettings
): string | null {
  const name = GLTFTextureMapNames.find((prop) => {
    const value = (materialCompressionSettings as any)[prop];
    return value?.original instanceof GLTFTexture;
  });

  return name ?? null;
}

export function buildGLTFTextureCompressionSettings(
  document: Document
): GLTFModelCompressionSettings {
  const compressionSettings: GLTFModelCompressionSettings = {
    materials: {},
  };

  const materials = document.getRoot().listMaterials();

  materials.forEach((material) => {
    const textureSettings: { [key: string]: GLTFTextureCompressionSettings } =
      {};
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
