import {
  ModelCompressionSettings,
  ModelStats,
  TextureCompressionSettings,
} from "@/types";
import {
  buildTextureCompressionSettings,
  filterMaterialNamesWithTextures,
  getFirstAvailableTextureName,
  getUniqueTexturesFromDocument,
} from "@/utils/utils";
import { Document, Texture } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";
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

  compressionSettings: ModelCompressionSettings | null;
  selectedTexture: string | null;
  selectedMaterial: string | null;
  setSelectedTexture: (textureName: string | null) => void;
  setSelectedMaterial: (materialName: string | null) => void;
  updateTextureCompressionSettings: (
    materialName: string,
    textureName: string,
    settings: TextureCompressionSettings
  ) => void;

  modelStats: ModelStats | null;
  modifiedTextures: Texture[] | null;
  setInitialModelStats: () => void;
  updateModelStats: () => void;
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

    set({
      originalDocument,
      modifiedDocument,
      scene,
      compressionSettings,
      selectedMaterial: materialName,
      selectedTexture: textureName,
    });

    get().setInitialModelStats();
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

  modelStats: null,
  modifiedTextures: null,
  setInitialModelStats: () => {
    const { originalDocument, modifiedDocument } = get();

    if (!originalDocument || !modifiedDocument) return;

    const report = inspect(originalDocument);

    const numRenderVertices = report.scenes.properties.reduce(
      (total, scene) => total + scene.renderVertexCount,
      0
    );

    const sizeOfMeshes = report.meshes.properties.reduce(
      (total, mesh) => total + mesh.size / 1000,
      0
    );

    const sizeOfTextures = report.textures.properties.reduce(
      (total, texture) => total + texture.size / 1000,
      0
    );

    const sizeOfAnimations = report.animations.properties.reduce(
      (total, animation) => total + animation.size / 1000,
      0
    );

    const totalSize = sizeOfMeshes + sizeOfTextures + sizeOfAnimations;
    const percentOfSizeTakenByMeshes = (sizeOfMeshes / totalSize) * 100;
    const percentOfSizeTakenByTextures = (sizeOfTextures / totalSize) * 100;
    const percentOfSizeTakenByAnimations = (sizeOfAnimations / totalSize) * 100;

    const modifiedTextures = getUniqueTexturesFromDocument(modifiedDocument);

    set({
      modelStats: {
        numMeshes: report.meshes.properties.length,
        numVertices: numRenderVertices,
        numTextures: report.textures.properties.length,
        numAnimationClips: report.animations.properties.length,
        sizeOfMeshes: sizeOfMeshes,
        sizeOfTextures: sizeOfTextures,
        sizeOfAnimations: sizeOfAnimations,
        percentOfSizeTakenByMeshes: percentOfSizeTakenByMeshes,
        percentOfSizeTakenByTextures: percentOfSizeTakenByTextures,
        percentOfSizeTakenByAnimations: percentOfSizeTakenByAnimations,
      },
      modifiedTextures,
    });
  },
  updateModelStats: () => {
    const { modelStats, modifiedTextures } = get();

    if (!modelStats || !modifiedTextures) return;

    let sizeOfTextures = 0;
    modifiedTextures.forEach((texture) => {
      const imageData = texture.getImage();
      if (imageData?.byteLength) {
        sizeOfTextures += imageData.byteLength / 1000;
      }
    });

    const totalSize =
      modelStats.sizeOfMeshes + sizeOfTextures + modelStats.sizeOfAnimations;

    set({
      modelStats: {
        ...modelStats,
        sizeOfTextures,
        percentOfSizeTakenByMeshes: (modelStats.sizeOfMeshes / totalSize) * 100,
        percentOfSizeTakenByTextures: (sizeOfTextures / totalSize) * 100,
        percentOfSizeTakenByAnimations:
          (modelStats.sizeOfAnimations / totalSize) * 100,
      },
    });
  },
}));
