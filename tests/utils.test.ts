import { MeshStandardMaterial, Texture } from "three";
import { GLTF } from "three-stdlib";
import { beforeEach, describe, expect, test } from "vitest";
import { defaultTextureQuality } from "../src/constants";
import { ModelCompressionSettings } from "../src/types";

import { ObjectMap } from "@react-three/fiber";
import {
  buildTextureCompressionSettings,
  filterMaterialNamesWithTextures,
  getAvailableTextureNames,
  getFirstAvailableTextureName,
  updateModel,
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

  test("buildTextureCompressionSettings returns empty object when no materials have textures", () => {
    const material1 = new MeshStandardMaterial();
    const material2 = new MeshStandardMaterial();

    const materials = {
      material1: material1,
      material2: material2,
    };

    const compressionSettings = buildTextureCompressionSettings(materials);

    expect(compressionSettings).toEqual({ materials: {} });
  });

  test("buildTextureCompressionSettings returns compression settings for each material and texture", () => {
    const material1 = new MeshStandardMaterial();
    material1.map = new Texture();

    const materials = {
      material1: material1,
    };

    const compressionSettings = buildTextureCompressionSettings(materials);

    expect(compressionSettings).toEqual({
      materials: {
        material1: {
          map: {
            original: material1.map,
            compressed: null,
            type: "map",
            quality: defaultTextureQuality,
            compressionEnabled: false,
          },
        },
      },
    });
  });

  describe("updateModel", () => {
    let model: GLTF & ObjectMap;
    let compressionSettings: ModelCompressionSettings;
    let materialA: MeshStandardMaterial;
    let materialB: MeshStandardMaterial;
    let materialC: MeshStandardMaterial;
    let originalDiffuseA: Texture;
    let originalDiffuseB: Texture;
    let originalDiffuseC: Texture;
    let compressedDiffuseB: Texture;
    let compressedDiffuseC: Texture;
    let originalNormalA: Texture;
    let originalNormalB: Texture;
    let originalNormalC: Texture;
    let compressedNormalA: Texture;
    let compressedNormalC: Texture;

    beforeEach(() => {
      // Build a model with 3 materials
      materialA = new MeshStandardMaterial();
      materialB = new MeshStandardMaterial();
      materialC = new MeshStandardMaterial();

      originalDiffuseA = new Texture();
      originalDiffuseB = new Texture();
      originalDiffuseC = new Texture();
      compressedDiffuseB = new Texture();
      compressedDiffuseC = new Texture();

      originalNormalA = new Texture();
      originalNormalB = new Texture();
      originalNormalC = new Texture();
      compressedNormalA = new Texture();
      compressedNormalC = new Texture();

      materialA.map = originalDiffuseA;
      materialA.normalMap = originalNormalA;
      materialB.map = originalDiffuseB;
      materialB.normalMap = originalNormalB;
      materialC.map = originalDiffuseC;
      materialC.normalMap = originalNormalC;

      model = {
        materials: {
          materialA,
          materialB,
          materialC,
        },
      } as unknown as GLTF & ObjectMap;

      compressionSettings = buildTextureCompressionSettings(model.materials);

      compressionSettings.materials.materialB.map.compressed =
        compressedDiffuseB;
      compressionSettings.materials.materialC.map.compressed =
        compressedDiffuseC;

      compressionSettings.materials.materialA.normalMap.compressed =
        compressedNormalA;

      compressionSettings.materials.materialC.normalMap.compressed =
        compressedNormalC;
    });

    test("with 'show compressed' off returns the original textures for all maps regardless of individual compression settings", () => {
      compressionSettings.materials.materialA.map.compressionEnabled = true;
      compressionSettings.materials.materialB.map.compressionEnabled = true;
      compressionSettings.materials.materialC.map.compressionEnabled = true;

      compressionSettings.materials.materialA.normalMap.compressionEnabled =
        true;
      compressionSettings.materials.materialC.normalMap.compressionEnabled =
        true;

      updateModel(model, compressionSettings, false);

      expect(
        (model.materials.materialA as MeshStandardMaterial).map?.uuid
      ).toBe(originalDiffuseA.uuid);
      expect(
        (model.materials.materialB as MeshStandardMaterial).map?.uuid
      ).toBe(originalDiffuseB.uuid);
      expect(
        (model.materials.materialC as MeshStandardMaterial).map?.uuid
      ).toBe(originalDiffuseC.uuid);

      expect(
        (model.materials.materialA as MeshStandardMaterial).normalMap?.uuid
      ).toBe(originalNormalA.uuid);
      expect(
        (model.materials.materialB as MeshStandardMaterial).normalMap?.uuid
      ).toBe(originalNormalB.uuid);
      expect(
        (model.materials.materialC as MeshStandardMaterial).normalMap?.uuid
      ).toBe(originalNormalC.uuid);
    });

    test("with 'show compressed' on, compression returns the correct textures based on compression settings", () => {
      compressionSettings.materials.materialA.map.compressionEnabled = false;
      compressionSettings.materials.materialB.map.compressionEnabled = true;
      compressionSettings.materials.materialC.map.compressionEnabled = false;

      updateModel(model, compressionSettings, true);

      expect(
        (model.materials.materialA as MeshStandardMaterial).map?.uuid
      ).toBe(originalDiffuseA.uuid);
      expect(
        (model.materials.materialB as MeshStandardMaterial).map?.uuid
      ).toBe(compressedDiffuseB.uuid);
      expect(
        (model.materials.materialC as MeshStandardMaterial).map?.uuid
      ).toBe(originalDiffuseC.uuid);
    });
  });
});
