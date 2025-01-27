import { Texture } from "three";

export interface TextureCompressionSettings {
  original: Texture;
  compressed: Texture | null;
  type: string;
  quality: number;
  compressionEnabled: boolean;
}
