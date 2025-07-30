import { Texture } from "@gltf-transform/core";

export interface TextureCompressionSettings {
  compressedTexture: Texture | null;
  compressionEnabled: boolean;
  mimeType: string;
  maxResolution: number;
  quality: number;
  isBeingCompressed: boolean;
}

export interface ModelStats {
  numMeshes: number;
  numVertices: number;
  numTextures: number;
  numAnimationClips: number;
  sizeOfMeshes: number;
  sizeOfTextures: number;
  sizeOfAnimations: number;
  totalSize: number;
  percentOfSizeTakenByMeshes: number;
  percentOfSizeTakenByTextures: number;
  percentOfSizeTakenByAnimations: number;
  initialSizeOfTextures: number;
  percentChangeInTextures: number;
  texturesInModifiedDocument: Texture[];
  initialTotalSize: number;
  percentChangeInTotalSize: number;
}

export interface TextureBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
  statusShouldBeAboveBottomEdge: boolean;
}
