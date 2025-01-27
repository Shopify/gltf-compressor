import { TextureCompressionSettings } from "@/types";
import { getFirstAvailableTextureName } from "@/utils/utils";
import { Texture } from "three";
import { create } from "zustand";

interface ModelStore {
  model: any | null;
  compressionSettings: {
    [key: string]: { [key: string]: TextureCompressionSettings };
  };
  selectedTexture: string | null;
  selectedMaterial: string | null;
  setModel: (model: any) => void;
  setSelectedTexture: (textureName: string | null) => void;
  setSelectedMaterial: (materialName: string | null) => void;
  updateTextureCompressionSettings: (
    materialName: string,
    textureName: string,
    settings: TextureCompressionSettings
  ) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  model: null,
  compressionSettings: {},
  selectedTexture: null,
  selectedMaterial: null,
  setModel: (model) => {
    let materialName, textureName;
    const { materials } = model;
    if (materials) {
      materialName = Object.keys(materials)[0];
      if (materialName) {
        const material = materials[materialName];
        textureName = getFirstAvailableTextureName(material);
      }
    }
    set({
      model,
      selectedMaterial: materialName,
      selectedTexture: textureName,
    });
  },
  setSelectedTexture: (textureName) => set({ selectedTexture: textureName }),
  setSelectedMaterial: (materialName) => {
    if (!materialName) return;

    const { model, selectedTexture } = get();
    const { materials } = model;

    const material = materials[materialName];
    if (!material) return;

    let textureName = selectedTexture;

    if (textureName && !(material[textureName] instanceof Texture)) {
      textureName = null;
    }

    if (!textureName) {
      textureName = getFirstAvailableTextureName(material);
    }

    set({ selectedMaterial: materialName, selectedTexture: textureName });
  },
  updateTextureCompressionSettings: (
    materialName: string,
    textureName: string,
    settings: TextureCompressionSettings
  ) => {
    const { compressionSettings } = get();

    set({
      compressionSettings: {
        ...compressionSettings,
        [materialName]: {
          ...compressionSettings[materialName],
          [textureName]: settings,
        },
      },
    });
  },
}));
