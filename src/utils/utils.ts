import { Material, Texture } from "three";
import { textureMapNames } from "../constants";

/**
 * Given a hash map of materials, returns an array of material names that have textures set
 * @param materials The materials to filter
 * @returns An array of material names that have textures set
 */
export function filterMaterialNamesWithTextures(
  materials: Record<string, Material>
): string[] {
  return Object.keys(materials).filter((materialName) =>
    getFirstAvailableTextureName(materials[materialName])
  );
}

/**
 * Extracts all available texture map names from a Three.js material
 * @param material The Three.js material to extract textures from
 * @returns An object containing all texture map names with their property names as keys
 */
export function getAvailableTextureNames(
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
 * @param material The Three.js material to extract textures from
 * @returns The first available texture or null if no texture is found
 */
export function getFirstAvailableTextureName(
  material: Material
): string | null {
  const name = textureMapNames.find((prop) => {
    const value = (material as any)[prop];
    return value instanceof Texture;
  });

  return name ?? null;
}
