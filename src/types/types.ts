import { Texture } from "@gltf-transform/core";

export type KTX2OutputType = "UASTC" | "ETC1S" | "UASTC_HDR";

export interface KTX2Options {
  outputType: KTX2OutputType;
  generateMipmaps: boolean;
  isNormalMap: boolean;
  srgbTransferFunction: boolean;
  enableSupercompression: boolean;
  enableRDO: boolean;
  rdoQualityLevel: number;
}

export const defaultKTX2Options: KTX2Options = {
  outputType: "UASTC",
  generateMipmaps: true,
  isNormalMap: false,
  srgbTransferFunction: true,
  enableSupercompression: true,
  enableRDO: false,
  rdoQualityLevel: 1.0,
};

export interface TextureCompressionSettings {
  compressedTexture: Texture | null;
  compressionEnabled: boolean;
  mimeType: string;
  maxResolution: number;
  quality: number;
  isBeingCompressed: boolean;
  ktx2Options: KTX2Options;
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
