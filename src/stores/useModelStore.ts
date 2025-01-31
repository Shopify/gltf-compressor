import {
  GLTFModelCompressionSettings,
  GLTFTextureCompressionSettings,
} from "@/types";
import {
  buildTextureCompressionSettings,
  filterMaterialNamesWithTextures,
  getFirstAvailableTextureName,
} from "@/utils/utils";
import { Document } from "@gltf-transform/core";
import { Group } from "three";
import { create } from "zustand";

interface ModelStore {
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  scene: Group | null;
  setDocuments: (
    originalDocument: Document,
    modifiedDocument: Document,
    scene: Group
  ) => void;

  compressionSettings: GLTFModelCompressionSettings | null;
  selectedTexture: string | null;
  selectedMaterial: string | null;
  setSelectedTexture: (textureName: string | null) => void;
  setSelectedMaterial: (materialName: string | null) => void;
  updateTextureCompressionSettings: (
    materialName: string,
    textureName: string,
    settings: GLTFTextureCompressionSettings
  ) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  originalDocument: null,
  modifiedDocument: null,
  scene: null,
  setDocuments: (originalDocument, modifiedDocument, scene) => {
    const compressionSettings =
      buildTextureCompressionSettings(originalDocument);

    // Get the first material and texture for initial selection
    let materialName = filterMaterialNamesWithTextures(compressionSettings)[0];
    let textureName = materialName
      ? getFirstAvailableTextureName(
          compressionSettings.materials[materialName]
        )
      : null;

    console.log("*** NEW: ");
    console.log(compressionSettings);
    console.log(materialName, textureName);

    set({
      originalDocument,
      modifiedDocument,
      scene,
      compressionSettings,
      selectedMaterial: materialName,
      selectedTexture: textureName,
    });
  },

  compressionSettings: null,
  selectedTexture: null,
  selectedMaterial: null,
  setSelectedTexture: (textureName) => set({ selectedTexture: textureName }),
  setSelectedMaterial: (materialName) => {
    if (!materialName) return;

    const { selectedTexture, compressionSettings } = get();
    if (!compressionSettings) return;

    // Check if the material exists in our compression settings
    const materialSettings = compressionSettings.materials[materialName];
    if (!materialSettings) return;

    let textureName = selectedTexture;

    // If the current texture doesn't exist in the new material, reset it
    if (textureName && !materialSettings[textureName]) {
      textureName = null;
    }

    // If we need a new texture, get the first available one
    if (!textureName) {
      textureName = getFirstAvailableTextureName(materialSettings);
    }

    set({ selectedMaterial: materialName, selectedTexture: textureName });
  },
  updateTextureCompressionSettings: (
    materialName: string,
    mapName: string,
    settings: GLTFTextureCompressionSettings
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
