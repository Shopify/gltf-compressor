import { Texture } from "@gltf-transform/core";

export interface TextureCompressionSettings {
  compressedTexture: Texture | null;
  mimeType: string;
  quality: number;
  compressionEnabled: boolean;
  maxDimension: number;
}

export interface MaterialCompressionSettings {
  [mapName: string]: TextureCompressionSettings;
}

export interface ModelCompressionSettings {
  materials: { [materialName: string]: MaterialCompressionSettings };
  textures: Map<Texture, TextureCompressionSettings>;
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
