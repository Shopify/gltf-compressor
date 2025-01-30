import { useModelStore } from "@/stores/useModelStore";
import { TextureCompressionSettings } from "@/types";
import {
  filterMapNamesWithTextures,
  filterMaterialNamesWithTextures,
} from "@/utils/utils";
import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { Texture } from "three";

export default function TextureView() {
  const {
    model,
    compressionSettings,
    updateTextureCompressionSettings,
    selectedTexture,
    selectedMaterial,
    setSelectedMaterial,
    setSelectedTexture,
  } = useModelStore();

  const { materials = {} } = model || {};

  const material = selectedMaterial ? materials[selectedMaterial] : null;
  const texture = selectedTexture
    ? material?.[selectedTexture as keyof typeof material]
    : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [_, set] = useControls(
    "Materials",
    () => ({
      materialName: {
        value: selectedMaterial,
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
    }),
    [selectedMaterial, selectedTexture, model, compressionSettings]
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
  }, [selectedMaterial, selectedTexture, model, compressionSettings]);

  useEffect(() => {
    if (!texture) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = (texture as Texture).image.width;
    canvas.height = (texture as Texture).image.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage((texture as Texture).image, 0, 0);
    }
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
