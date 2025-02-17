import { MATERIAL_FOLDER_ORDER } from "@/constants";
import { useModelStore } from "@/stores/useModelStore";
import {
  getAvailableMaterialNames,
  getMaterialbyName,
  getMaterialTextureBySlot,
} from "@/utils/documentUtils";
import {
  getTexturesFromMaterial,
  getTextureSlotsFromMaterial,
} from "@/utils/utils";
import { button, useControls } from "leva";
import { useEffect } from "react";

export default function MaterialEditPanel() {
  const {
    originalDocument,
    selectedTextureSlot,
    selectedTexture,
    selectedMaterial,
    compressionSettings,
    setSelectedMaterial,
    setSelectedTextureSlot,
    setSelectedTexture,
    updateTextureCompressionSettings,
    updateModelStats,
  } = useModelStore();

  useEffect(() => {
    const firstMaterial = originalDocument?.getRoot().listMaterials()[0];
    if (firstMaterial) {
      setSelectedMaterial(firstMaterial);
      const { slot, texture: firstTexture } =
        getTexturesFromMaterial(firstMaterial)?.[0];
      setSelectedTextureSlot(slot ?? "");
      setSelectedTexture(firstTexture);
    }
  }, [originalDocument]);

  const [_, set] = useControls(
    "Materials",
    () => {
      return {
        materialName: {
          value: selectedMaterial?.getName(),
          label: "Material",
          options: originalDocument
            ? getAvailableMaterialNames(originalDocument)
            : [],
          onChange: (value) => {
            if (value && originalDocument) {
              const material = getMaterialbyName(originalDocument, value);
              if (material) {
                const textures = getTexturesFromMaterial(material);
                const { slot, texture: firstTexture } = textures?.[0] ?? {};
                setSelectedMaterial(material);
                setSelectedTexture(firstTexture);
                setSelectedTextureSlot(slot ?? "");
              }
            }
          },
        },
        textureName: {
          value: selectedTextureSlot,
          label: "Texture",
          options:
            selectedMaterial && originalDocument
              ? getTextureSlotsFromMaterial(selectedMaterial)
              : [],
          onChange: (value) => {
            if (value && originalDocument && selectedMaterial) {
              const texture = getMaterialTextureBySlot(selectedMaterial, value);
              setSelectedTexture(texture);
              setSelectedTextureSlot(value);
            }
          },
        },
        compressionEnabled: {
          value: selectedTexture
            ? compressionSettings?.textures.get(selectedTexture)
                ?.compressionEnabled ?? false
            : false,
          label: "Compress?",
          onChange: (value) => {
            if (selectedMaterial && selectedTexture) {
              updateTextureCompressionSettings(selectedTexture, {
                compressionEnabled: value,
              });
            }
          },
        },
        compress: button(async () => {
          // const texture = originalDocument?.getRoot().listTextures()[1];
          // await compressDocumentTexture(
          //   texture,
          //   compressionSettings?.textures.get(texture)
          // );
          updateModelStats();
        }),
      };
    },
    { collapsed: false, order: MATERIAL_FOLDER_ORDER },
    [selectedMaterial, selectedTextureSlot, compressionSettings]
  );

  useEffect(() => {
    set({
      materialName: selectedMaterial?.getName(),
      textureName: selectedTextureSlot,
      compressionEnabled: selectedTexture
        ? compressionSettings?.textures.get(selectedTexture)
            ?.compressionEnabled ?? false
        : false,
    });
  }, [
    selectedMaterial,
    selectedTextureSlot,
    selectedTexture,
    compressionSettings,
  ]);

  return null;
}
