import { MeshStandardMaterial, Texture } from "three";
import { describe, expect, test } from "vitest";
import {
  filterMaterialNamesWithTextures,
  getAvailableTextureNames,
  getFirstAvailableTextureName,
} from "../src/utils/utils";

describe("Utils", () => {
  test("filterMaterialNamesWithTextures is empty when no materials have textures", () => {
    const materials = {
      material1: new MeshStandardMaterial(),
      material2: new MeshStandardMaterial(),
    };

    const filteredMaterials = filterMaterialNamesWithTextures(materials);

    expect(filteredMaterials).toHaveLength(0);
  });

  test("filterMaterialNamesWithTextures returns all materials when all materials have textures", () => {
    const materialWithTexture = new MeshStandardMaterial();
    materialWithTexture.map = new Texture();

    const materialWithoutTexture = new MeshStandardMaterial();

    const materials = {
      materialWithTexture: materialWithTexture,
      materialWithoutTexture: materialWithoutTexture,
    };

    const filteredMaterials = filterMaterialNamesWithTextures(materials);

    expect(filteredMaterials).toHaveLength(1);
    expect(filteredMaterials).toEqual(["materialWithTexture"]);
  });

  test("getAvailableTextureNames should return only the texture maps that are available", () => {
    const material = new MeshStandardMaterial();
    const baseTexture = new Texture();
    const normalTexture = new Texture();
    const roughnessTexture = new Texture();

    material.map = baseTexture;
    material.normalMap = normalTexture;
    material.roughnessMap = roughnessTexture;

    const textures = getAvailableTextureNames(material);

    expect(textures).toBeDefined();
    expect(Object.keys(textures)).toHaveLength(3);
    expect(Object.values(textures)).toEqual([
      "map",
      "normalMap",
      "roughnessMap",
    ]);
  });

  test("getAvailableTextureNames should return empty object when no textures are set", () => {
    const material = new MeshStandardMaterial();
    const textures = getAvailableTextureNames(material);

    expect(textures).toBeDefined();
    expect(Object.keys(textures)).toHaveLength(0);
  });

  test("getFirstAvailableTextureName should return the first available texture according to the order in constants.ts", () => {
    const material = new MeshStandardMaterial();
    const normalTexture = new Texture();
    const baseTexture = new Texture();

    material.map = baseTexture;
    material.normalMap = normalTexture;

    const texture = getFirstAvailableTextureName(material);

    expect(texture).toBe("map");
  });
});
