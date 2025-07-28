import { ExtensionProperty, Material, Texture } from "@gltf-transform/core";

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

export const getTextureBySlot = (
  material: Material,
  slot: string
): Texture | null => {
  return (
    getTexturesFromMaterial(material).find(
      ({ slot: textureSlot }) => textureSlot === slot
    )?.texture || null
  );
};

export function getMaxResolutionOptions(maxDim: number): string[] {
  const options = [maxDim.toString()];
  const standardResolutions = [8192, 4096, 2048, 1024, 512, 256, 128];

  for (const resolution of standardResolutions) {
    if (resolution < maxDim) {
      options.push(resolution.toString());
    }
  }

  return options;
}

export function getTextureSizeInKB(
  texture: Texture | null | undefined
): number {
  if (!texture) return 0;

  const imageData = texture.getImage();
  if (!imageData?.byteLength) return 0;

  return imageData.byteLength / 1000;
}
