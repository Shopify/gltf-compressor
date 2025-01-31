import { Texture } from "@gltf-transform/core";

export interface TextureCompressionSettings {
  original: Texture;
  compressed: Texture | null;
  type: string;
  quality: number;
  compressionEnabled: boolean;
}

export interface MaterialCompressionSettings {
  [mapName: string]: TextureCompressionSettings;
}

export interface ModelCompressionSettings {
  materials: { [materialName: string]: MaterialCompressionSettings };
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
}
