import {
  GLTFModelCompressionSettings,
  TextureCompressionSettings,
} from "@/types";
import {
  buildGLTFTextureCompressionSettings,
  filterGLTFMaterialNamesWithTextures,
  getFirstAvailableGLTFTextureName,
  getFirstAvailableTextureName,
} from "@/utils/utils";
import { Document } from "@gltf-transform/core";
import { ObjectMap } from "@react-three/fiber";
import { Material, Texture } from "three";
import { GLTF } from "three-stdlib";
import { create } from "zustand";

interface ModelStore2 {
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  setDocuments: (
    originalDocument: Document,
    modifiedDocument: Document
  ) => void;

  model: (GLTF & ObjectMap) | null;
  compressionSettings: GLTFModelCompressionSettings | null;
  selectedTexture: string | null;
  selectedMaterial: string | null;
  setSelectedTexture: (textureName: string | null) => void;
  setSelectedMaterial: (materialName: string | null) => void;
  updateTextureCompressionSettings: (
    materialName: string,
    textureName: string,
    settings: TextureCompressionSettings
  ) => void;
}

export const useModelStore2 = create<ModelStore2>((set, get) => ({
  originalDocument: null,
  modifiedDocument: null,
  setDocuments: (originalDocument, modifiedDocument) => {
    const compressionSettings =
      buildGLTFTextureCompressionSettings(originalDocument);

    console.log("*** NEW: ");
    console.log(compressionSettings);

    // Get the first material and texture for initial selection
    let materialName =
      filterGLTFMaterialNamesWithTextures(compressionSettings)[0];
    let textureName = materialName
      ? getFirstAvailableGLTFTextureName(
          compressionSettings.materials[materialName]
        )
      : null;

    set({
      originalDocument,
      modifiedDocument,
      compressionSettings,
      selectedMaterial: materialName,
      selectedTexture: textureName,
    });
  },

  model: null,
  compressionSettings: null,
  selectedTexture: null,
  selectedMaterial: null,
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
