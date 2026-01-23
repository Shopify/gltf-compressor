import { Document, Material, Texture } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { produce } from "immer";
import { Group } from "three";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import {
  ModelStats,
  TextureBounds,
  TextureCompressionSettings,
} from "@/types/types";

interface ModelStore {
  fileName: string;
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  originalDocumentView: DocumentView | null;
  modifiedDocumentView: DocumentView | null;
  originalScene: Group | null;
  modifiedScene: Group | null;
  textureCompressionSettingsMap: Map<Texture, TextureCompressionSettings>;
  selectedMaterial: Material | null;
  selectedTextureSlot: string;
  selectedTexture: Texture | null;
  textureBounds: TextureBounds | null;
  modelStats: ModelStats;
  isBulkProcessing: boolean;
  bulkProcessingProgress: { current: number; total: number } | null;
  modifyingKTX2Texture: boolean;

  updateTextureCompressionSettings: (
    texture: Texture,
    settings: Partial<TextureCompressionSettings>
  ) => void;
  setInitialModelStats: () => void;
  updateModelStats: () => void;
}

export const useModelStore = create<ModelStore>()(
  subscribeWithSelector((set, get) => {
    return {
      fileName: "",
      originalDocument: null,
      modifiedDocument: null,
      originalDocumentView: null,
      modifiedDocumentView: null,
      originalScene: null,
      modifiedScene: null,
      textureCompressionSettingsMap: new Map<
        Texture,
        TextureCompressionSettings
      >(),
      selectedMaterial: null,
      selectedTextureSlot: "",
      selectedTexture: null,
      textureBounds: null,
      isBulkProcessing: false,
      bulkProcessingProgress: null,
      modifyingKTX2Texture: false,
      modelStats: {
        numMeshes: 0,
        numVertices: 0,
        numTextures: 0,
        numAnimationClips: 0,
        sizeOfMeshes: 0,
        sizeOfTextures: 0,
        sizeOfAnimations: 0,
        totalSize: 0,
        percentOfSizeTakenByMeshes: 0,
        percentOfSizeTakenByTextures: 0,
        percentOfSizeTakenByAnimations: 0,
        initialSizeOfTextures: 0,
        percentChangeInTextures: 0,
        texturesInModifiedDocument: [],
        initialTotalSize: 0,
        percentChangeInTotalSize: 0,
      },

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
        const percentOfSizeTakenByAnimations =
          (sizeOfAnimations / totalSize) * 100;

        const texturesInModifiedDocument = modifiedDocument
          .getRoot()
          .listTextures();

        set({
          modelStats: {
            numMeshes: report.meshes.properties.length,
            numVertices: numRenderVertices,
            numTextures: report.textures.properties.length,
            numAnimationClips: report.animations.properties.length,
            sizeOfMeshes,
            sizeOfTextures,
            sizeOfAnimations,
            totalSize,
            percentOfSizeTakenByMeshes,
            percentOfSizeTakenByTextures,
            percentOfSizeTakenByAnimations,
            initialSizeOfTextures: sizeOfTextures,
            percentChangeInTextures: 0,
            texturesInModifiedDocument,
            initialTotalSize: totalSize,
            percentChangeInTotalSize: 0,
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
          modelStats.sizeOfMeshes +
          sizeOfTextures +
          modelStats.sizeOfAnimations;

        const percentChangeInTextures =
          modelStats.initialSizeOfTextures > 0
            ? ((modelStats.initialSizeOfTextures - sizeOfTextures) /
              modelStats.initialSizeOfTextures) *
            100
            : 0;

        const percentChangeInTotalSize =
          modelStats.initialTotalSize > 0
            ? ((modelStats.initialTotalSize - totalSize) /
              modelStats.initialTotalSize) *
            100
            : 0;

        set({
          modelStats: {
            ...modelStats,
            sizeOfTextures,
            totalSize,
            percentOfSizeTakenByMeshes:
              (modelStats.sizeOfMeshes / totalSize) * 100,
            percentOfSizeTakenByTextures: (sizeOfTextures / totalSize) * 100,
            percentOfSizeTakenByAnimations:
              (modelStats.sizeOfAnimations / totalSize) * 100,
            percentChangeInTextures,
            percentChangeInTotalSize,
          },
        });
      },
    };
  })
);
