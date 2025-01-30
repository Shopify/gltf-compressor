import { ModelCompressionSettings, TextureCompressionSettings } from "@/types";
import {
  buildTextureCompressionSettings,
  filterMaterialNamesWithTextures,
  getFirstAvailableTextureName,
} from "@/utils/utils";
import { ObjectMap } from "@react-three/fiber";
import { Material, Texture } from "three";
import { GLTF } from "three-stdlib";
import { create } from "zustand";

interface ModelStore {
  model: (GLTF & ObjectMap) | null;
  compressionSettings: ModelCompressionSettings | null;
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
  compressionSettings: null,
  selectedTexture: null,
  selectedMaterial: null,
  setModel: (model: GLTF & ObjectMap) => {
    let materialName, textureName;
    const { materials } = model;

    const compressionSettings = buildTextureCompressionSettings(materials);
    if (materials) {
      materialName = filterMaterialNamesWithTextures(compressionSettings)[0];
      if (materialName) {
        textureName = getFirstAvailableTextureName(
          compressionSettings.materials[materialName]
        );
      }
    }

    console.log("*** OLD: ");
    console.log(compressionSettings);
    console.log(materialName, textureName);

    set({
      model,
      selectedMaterial: materialName,
      selectedTexture: textureName,
      compressionSettings: compressionSettings,
    });
  },
  setSelectedTexture: (textureName) => set({ selectedTexture: textureName }),
  setSelectedMaterial: (materialName) => {
    if (!materialName) return;

    const { model, selectedTexture, compressionSettings } = get();
    if (!model) return;

    const { materials } = model;

    const material = materials[materialName];
    if (!material) return;

    let textureName = selectedTexture;

    if (
      textureName &&
      !(material[textureName as keyof Material] instanceof Texture)
    ) {
      textureName = null;
    }

    if (!textureName && compressionSettings) {
      textureName = getFirstAvailableTextureName(
        compressionSettings.materials[materialName]
      );
    }

    set({ selectedMaterial: materialName, selectedTexture: textureName });
  },
  updateTextureCompressionSettings: (
    materialName: string,
    mapName: string,
    settings: TextureCompressionSettings
  ) => {
    const { compressionSettings } = get();

    if (!compressionSettings) return;

    set({
      compressionSettings: {
        ...compressionSettings,
        materials: {
          ...compressionSettings.materials,
          [materialName]: {
            ...compressionSettings.materials[materialName],
            [mapName]: settings,
          },
        },
      },
    });
  },
}));
