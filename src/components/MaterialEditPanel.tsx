import { useModelStore } from "@/stores/useModelStore";
import { TextureCompressionSettings } from "@/types";
import { compressDocumentTexture } from "@/utils/documentUtils";
import {
  filterMapNamesWithTextures,
  filterMaterialNamesWithTextures,
} from "@/utils/utils";
import { button, useControls } from "leva";
import { useEffect } from "react";

export default function MaterialEditPanel() {
  const {
    compressionSettings,
    updateTextureCompressionSettings,
    selectedTexture,
    selectedMaterial,
    setSelectedMaterial,
    setSelectedTexture,
    updateModelStats,
  } = useModelStore();

  const [_, set] = useControls(
    "Materials",
    () => ({
      materialName: {
        value: selectedMaterial,
        label: "Material",
        options: compressionSettings
          ? filterMaterialNamesWithTextures(compressionSettings)
          : [],
        onChange: (value) => {
          if (value) {
            setSelectedMaterial(value);
          }
        },
      },
      textureName: {
        value: selectedTexture,
        label: "Texture",
        options:
          selectedMaterial && compressionSettings
            ? filterMapNamesWithTextures(
                compressionSettings.materials[selectedMaterial]
              )
            : [],
        onChange: (value) => {
          if (value) {
            setSelectedTexture(value);
          }
        },
      },
      compressionEnabled: {
        value:
          selectedMaterial && selectedTexture
            ? compressionSettings?.materials[selectedMaterial]?.[
                selectedTexture
              ]?.compressionEnabled ?? false
            : false,
        label: "Compress?",
        onChange: (value) => {
          if (selectedMaterial && selectedTexture) {
            console.log("UPDATING", selectedMaterial, selectedTexture, value);
            updateTextureCompressionSettings(
              selectedMaterial,
              selectedTexture,
              {
                ...compressionSettings?.materials[selectedMaterial]?.[
                  selectedTexture
                ],
                compressionEnabled: value,
              } as TextureCompressionSettings
            );
          }
        },
      },
      compress: button(async () => {
        if (!selectedMaterial || !selectedTexture) return;
        const { originalDocument, modifiedDocument } = useModelStore.getState();
        if (!originalDocument || !modifiedDocument) return;

        const originalTexture = originalDocument.getRoot().listTextures()[0];
        const modifiedTexture = modifiedDocument.getRoot().listTextures()[0];

        await compressDocumentTexture(originalTexture, modifiedTexture);
        updateModelStats();
      }),
    }),
    [selectedMaterial, selectedTexture, compressionSettings]
  );

  useEffect(() => {
    set({
      materialName: selectedMaterial,
      textureName: selectedTexture,
      compressionEnabled:
        selectedMaterial && selectedTexture
          ? compressionSettings?.materials[selectedMaterial]?.[selectedTexture]
              ?.compressionEnabled ?? false
          : false,
    });
  }, [selectedMaterial, selectedTexture, compressionSettings]);

  return null;
}
