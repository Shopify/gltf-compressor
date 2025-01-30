import { Texture as GLTFTexture } from "@gltf-transform/core";
import { Texture } from "three";

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

// ***

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
