import { ModelStats, TextureCompressionSettings } from "@/types";
import { getUniqueTextures } from "@/utils/utils";
import { Document, Material, Texture } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";
import { produce } from "immer";
import { Group } from "three";
import { create } from "zustand";

interface ModelStore {
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  scene: Group | null;
  textureCompressionSettingsMap: Map<
    Texture,
    TextureCompressionSettings
  > | null;
  selectedTexture: Texture | null;
  selectedTextureSlot: string;
  selectedMaterial: Material | null;
  texturesBeingCompressed: Set<Texture>;
  modelStats: ModelStats | null;
  modifiedTextures: Texture[] | null;
  showingCompressedTexture: boolean;

  setSelectedTexture: (texture: Texture | null) => void;
  setSelectedTextureSlot: (slot: string) => void;
  setSelectedMaterial: (material: Material | null) => void;
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
  textureCompressionSettingsMap: null,
  selectedTexture: null,
  selectedTextureSlot: "",
  selectedMaterial: null,
  texturesBeingCompressed: new Set<Texture>(),
  modelStats: null,
  modifiedTextures: null,
  showingCompressedTexture: false,

  setSelectedTexture: (texture: Texture | null) =>
    set({ selectedTexture: texture }),
  setSelectedTextureSlot: (slot: string) => set({ selectedTextureSlot: slot }),
  setSelectedMaterial: (material: Material | null) => {
    if (!material) return;
    set({ selectedMaterial: material });
  },
  updateTextureCompressionSettings: (
    texture: Texture,
    settings: Partial<TextureCompressionSettings>
  ) => {
    const { textureCompressionSettingsMap } = get();
    if (!textureCompressionSettingsMap) return;
    set(
      produce((state: ModelStore) => {
        state.textureCompressionSettingsMap!.set(texture, {
          ...textureCompressionSettingsMap.get(texture)!,
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

    const modifiedTextures = getUniqueTextures(modifiedDocument);

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
        percentChangeInTextures: null,
      },
      modifiedTextures,
    });
  },
  updateModelStats: () => {
    const { modelStats, modifiedTextures } = get();

    if (!modelStats || !modifiedTextures) return;

    let sizeOfTextures = 0;
    modifiedTextures.forEach((texture: Texture) => {
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
        : null;

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
