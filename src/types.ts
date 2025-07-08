import { Texture } from "@gltf-transform/core";

export interface TextureCompressionSettings {
  compressedTexture: Texture | null;
  compressionEnabled: boolean;
  quality: number;
  mimeType: string;
  maxDimension: number;
}

export interface ModelStats {
  numMeshes: number;
  numVertices: number;
  numTextures: number;
  numAnimationClips: number;
  sizeOfMeshes: number;
  sizeOfTextures: number;
  sizeOfAnimations: number;
  percentOfSizeTakenByMeshes: number;
  percentOfSizeTakenByTextures: number;
  percentOfSizeTakenByAnimations: number;
  initialSizeOfTextures: number;
  percentChangeInTextures: number | null;
}
