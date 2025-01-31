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
