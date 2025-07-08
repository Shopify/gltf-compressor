import { MeshStandardMaterial, Texture } from "three";
import { describe, expect, test } from "vitest";

import {
  filterMapNamesWithTextures,
  getFirstAvailableTextureName,
} from "../src/utils/utils";

describe("Utils", () => {
  test("filterMapNamesWithTextures should return all map names when all maps have textures", () => {
    const materialCompressionSettings = {
      map: {
        original: new Texture(),
      },
      normalMap: {
        original: new Texture(),
      },
    };

    const mapNames = filterMapNamesWithTextures(materialCompressionSettings);

    expect(mapNames).toHaveLength(2);
    expect(mapNames).toEqual(expect.arrayContaining(["map", "normalMap"]));
  });

  test("getFirstAvailableTextureName should return the first available texture according to the order in constants.ts", () => {
    const material = new MeshStandardMaterial();
    const normalTexture = new Texture();
    const baseTexture = new Texture();

    const materialCompressionSettings = {
      map: {
        original: baseTexture,
      },
      normalMap: {
        original: normalTexture,
      },
    };

    const texture = getFirstAvailableTextureName(materialCompressionSettings);

    expect(texture).toBe("map");
  });
});
