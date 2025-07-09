import { ModelStats, TextureCompressionSettings } from "@/types";
import { Document, Material, Texture } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";
import { produce } from "immer";
import { Group } from "three";
import { create } from "zustand";

interface ModelStore {
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  scene: Group | null;
  textureCompressionSettingsMap: Map<Texture, TextureCompressionSettings>;
  selectedMaterial: Material | null;
  selectedTextureSlot: string;
  selectedTexture: Texture | null;
  texturesBeingCompressed: Set<Texture>;
  modelStats: ModelStats;
  showingCompressedTexture: boolean;

  setSelectedMaterial: (material: Material) => void;
  setSelectedTextureSlot: (slot: string) => void;
  setSelectedTexture: (texture: Texture | null) => void;
  updateTextureCompressionSettings: (
    texture: Texture,
    settings: Partial<TextureCompressionSettings>
  ) => void;
  updateTexturesBeingCompressed: (
    texture: Texture,
    isCompressing: boolean
  ) => void;
  setInitialModelStats: () => void;
  updateModelStats: () => void;
  setShowingCompressedTexture: (showingCompressedTexture: boolean) => void;
}

export const useModelStore = create<ModelStore>()((set, get) => ({
  originalDocument: null,
  modifiedDocument: null,
  scene: null,
  textureCompressionSettingsMap: new Map<Texture, TextureCompressionSettings>(),
  selectedMaterial: null,
  selectedTextureSlot: "",
  selectedTexture: null,
  texturesBeingCompressed: new Set<Texture>(),
  modelStats: {
    numMeshes: 0,
    numVertices: 0,
    numTextures: 0,
    numAnimationClips: 0,
    sizeOfMeshes: 0,
    sizeOfTextures: 0,
    sizeOfAnimations: 0,
    percentOfSizeTakenByMeshes: 0,
    percentOfSizeTakenByTextures: 0,
    percentOfSizeTakenByAnimations: 0,
    initialSizeOfTextures: 0,
    percentChangeInTextures: 0,
    texturesInModifiedDocument: [],
  },
  showingCompressedTexture: false,

  setSelectedMaterial: (material: Material) => {
    set({ selectedMaterial: material });
  },
  setSelectedTextureSlot: (slot: string) => set({ selectedTextureSlot: slot }),
  setSelectedTexture: (texture: Texture | null) =>
    set({ selectedTexture: texture }),
  updateTextureCompressionSettings: (
    texture: Texture,
    settings: Partial<TextureCompressionSettings>
  ) => {
    const { textureCompressionSettingsMap } = get();
    const existingSettings = textureCompressionSettingsMap.get(texture);
    if (!existingSettings) return;

    set(
      produce((state: ModelStore) => {
        state.textureCompressionSettingsMap.set(texture, {
          ...existingSettings,
          ...settings,
        } as TextureCompressionSettings);
      })
    );
  },
  updateTexturesBeingCompressed: (texture: Texture, isCompressing: boolean) => {
    set(
      produce((state: ModelStore) => {
        if (isCompressing) {
          state.texturesBeingCompressed.add(texture);
        } else {
          state.texturesBeingCompressed.delete(texture);
        }
      })
    );
  },
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

    const texturesInModifiedDocument = modifiedDocument
      .getRoot()
      .listTextures();

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
        initialSizeOfTextures: sizeOfTextures,
        percentChangeInTextures: 0,
        texturesInModifiedDocument: texturesInModifiedDocument,
      },
    });
  },
  updateModelStats: () => {
    const { modelStats } = get();

    let sizeOfTextures = 0;
    modelStats.texturesInModifiedDocument.forEach((texture: Texture) => {
      const imageData = texture.getImage();
      if (imageData?.byteLength) {
        sizeOfTextures += imageData.byteLength / 1000;
      }
    });

    const totalSize =
      modelStats.sizeOfMeshes + sizeOfTextures + modelStats.sizeOfAnimations;

    const percentChangeInTextures =
      modelStats.initialSizeOfTextures > 0
        ? ((modelStats.initialSizeOfTextures - sizeOfTextures) /
            modelStats.initialSizeOfTextures) *
          100
        : 0;

    set({
      modelStats: {
        ...modelStats,
        sizeOfTextures,
        percentOfSizeTakenByMeshes: (modelStats.sizeOfMeshes / totalSize) * 100,
        percentOfSizeTakenByTextures: (sizeOfTextures / totalSize) * 100,
        percentOfSizeTakenByAnimations:
          (modelStats.sizeOfAnimations / totalSize) * 100,
        percentChangeInTextures,
      },
    });
  },
  setShowingCompressedTexture: (showingCompressedTexture: boolean) => {
    set({ showingCompressedTexture });
  },
}));
