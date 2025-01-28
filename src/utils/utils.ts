import { defaultTextureQuality, textureMapNames } from "@/constants";
import {
  MaterialCompressionSettings,
  ModelCompressionSettings,
  TextureCompressionSettings,
} from "@/types";
import { ObjectMap } from "@react-three/fiber";
import { Material, Texture } from "three";
import { GLTF } from "three-stdlib";

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
 * Extracts all available texture map names from a Three.js material
 * @param material The Three.js material to extract textures from
 * @returns An object containing all texture map names with their property names as keys
 */
export function getAvailableTextureNamesFromMaterial(
  material: Material
): Record<string, string> {
  const textureMaps: Record<string, string> = {};

  textureMapNames.forEach((prop) => {
    const value = (material as any)[prop];
    if (value instanceof Texture) {
      textureMaps[prop] = prop;
    }
  });

  return textureMaps;
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
  materials: Record<string, Material>
): ModelCompressionSettings {
  const compressionSettings: ModelCompressionSettings = {
    materials: {},
  };

  Object.entries(materials).forEach(([materialName, material]) => {
    const availableTextures = getAvailableTextureNamesFromMaterial(material);

    if (Object.keys(availableTextures).length > 0) {
      const textureSettings: { [key: string]: TextureCompressionSettings } = {};

      Object.keys(availableTextures).forEach((textureProp) => {
        textureSettings[textureProp] = {
          original: (material as any)[textureProp],
          compressed: null,
          type: textureProp,
          quality: defaultTextureQuality,
          compressionEnabled: false,
        };
      });

      compressionSettings.materials[materialName] = textureSettings;
    }
  });

  return compressionSettings;
}

export function updateModel(
  model: GLTF & ObjectMap,
  compressionSettings: ModelCompressionSettings,
  showCompressed: boolean
) {
  const { materials } = model;

  Object.entries(compressionSettings.materials).forEach(
    ([materialName, maps]) => {
      const material = materials[materialName];

      Object.entries(maps as MaterialCompressionSettings).forEach(
        ([mapName, settings]) => {
          (material as any)[mapName] =
            showCompressed && settings.compressionEnabled
              ? settings.compressed
              : settings.original;
          material.needsUpdate = true;
        }
      );
    }
  );
}
