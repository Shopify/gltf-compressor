import { useModelStore } from "@/stores/useModelStore";
import { GLTFTextureCompressionSettings } from "@/types";
import {
  filterGLTFMapNamesWithTextures,
  filterGLTFMaterialNamesWithTextures,
} from "@/utils/utils";
import { useControls } from "leva";
import { useEffect, useRef } from "react";

export default function TextureView() {
  const {
    compressionSettings,
    updateTextureCompressionSettings,
    selectedTexture,
    selectedMaterial,
    setSelectedMaterial,
    setSelectedTexture,
  } = useModelStore();

  const materials = compressionSettings?.materials ?? {};

  const material = selectedMaterial ? materials[selectedMaterial] : null;
  const texture = selectedTexture
    ? material?.[selectedTexture as keyof typeof material].original
    : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [_, set] = useControls(
    "Materials",
    () => ({
      materialName: {
        value: selectedMaterial,
        options: compressionSettings
          ? filterGLTFMaterialNamesWithTextures(compressionSettings)
          : [],
        onChange: (value) => {
          if (value) {
            setSelectedMaterial(value);
          }
        },
      },
      textureName: {
        value: selectedTexture,
        options:
          selectedMaterial && compressionSettings
            ? filterGLTFMapNamesWithTextures(
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
              } as GLTFTextureCompressionSettings
            );
          }
        },
      },
    }),
    [selectedMaterial, selectedTexture, /*model,*/ compressionSettings]
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
  }, [selectedMaterial, selectedTexture, /*model,*/ compressionSettings]);

  useEffect(() => {
    const loadTexture = async () => {
      if (!texture) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const size = texture.getSize();
      const imageData = texture.getImage();
      const mimeType = texture.getMimeType();
      if (!size || !imageData) return;

      canvas.width = size[0];
      canvas.height = size[1];
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const blob = new Blob([imageData], {
          type: mimeType,
        });
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (e) => reject(console.log(e));
          img.src = blobUrl;
        });
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(blobUrl);
      }
    };

    loadTexture();
  }, [selectedTexture, selectedMaterial]);

  return (
    <div
      id="texture-view"
      style={{ width: "100%", height: "100%", backgroundColor: "black" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: selectedTexture ? "block" : "none",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
