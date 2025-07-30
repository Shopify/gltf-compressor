import { useModelStore } from "@/stores/useModelStore";
import { TextureBounds } from "@/types/types";
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

function calculateTextureBounds(
  canvas: HTMLCanvasElement,
  textureWidth: number,
  textureHeight: number
): TextureBounds {
  const canvasRect = canvas.getBoundingClientRect();
  const canvasWidth = canvasRect.width;
  const canvasHeight = canvasRect.height;

  const canvasAspectRatio = canvasWidth / canvasHeight;
  const textureAspectRatio = textureWidth / textureHeight;

  let displayedWidth, displayedHeight, offsetX, offsetY;

  if (textureAspectRatio > canvasAspectRatio) {
    // Texture is wider relative to canvas - will be letterboxed (black bars top/bottom)
    displayedWidth = canvasWidth;
    displayedHeight = canvasWidth / textureAspectRatio;
    offsetX = 0;
    offsetY = (canvasHeight - displayedHeight) / 2;
  } else {
    // Texture is taller relative to canvas - will be pillarboxed (black bars left/right)
    displayedWidth = canvasHeight * textureAspectRatio;
    displayedHeight = canvasHeight;
    offsetX = (canvasWidth - displayedWidth) / 2;
    offsetY = 0;
  }

  const bottom = offsetY + displayedHeight;

  // Check if there's enough space below the texture for the status message
  // The message is 16 pixels tall and we want to have a padding of 32 pixels with the bottom of the canvas
  // That's why we add 48 pixels in the line below
  const statusShouldBeAboveBottomEdge = bottom + 48 > canvasRect.bottom;

  return {
    left: offsetX,
    top: offsetY,
    width: displayedWidth,
    height: displayedHeight,
    bottom,
    statusShouldBeAboveBottomEdge,
  };
}

export function updateTextureBounds(
  canvas: HTMLCanvasElement | null,
  texture: Texture | null
) {
  if (!canvas || !texture) {
    useModelStore.setState({ textureBounds: null });
    return;
  }

  const resolution = texture.getSize();
  if (!resolution) {
    useModelStore.setState({ textureBounds: null });
    return;
  }

  const bounds = calculateTextureBounds(canvas, resolution[0], resolution[1]);
  useModelStore.setState({ textureBounds: bounds });
}
