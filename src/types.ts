import { Texture as GLTFTexture } from "@gltf-transform/core";

export interface GLTFTextureCompressionSettings {
  original: GLTFTexture;
  compressed: GLTFTexture | null;
  type: string;
  quality: number;
  compressionEnabled: boolean;
}

export interface GLTFMaterialCompressionSettings {
  [mapName: string]: GLTFTextureCompressionSettings;
}

export interface GLTFModelCompressionSettings {
  materials: { [materialName: string]: GLTFMaterialCompressionSettings };
}
