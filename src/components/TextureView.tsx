import { useControls } from "leva";
import { useEffect, useRef } from "react";
import { useModelStore } from "../stores/useModelStore";
import {
  filterMaterialNamesWithTextures,
  getAvailableTextureNames,
} from "../utils/utils";

export default function TextureView() {
  const {
    model,
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
    () => ({
      materialName: {
        value: selectedMaterial,
        options: filterMaterialNamesWithTextures(materials),
        onChange: (value) => {
          if (value) {
            setSelectedMaterial(value);
          }
        },
      },
      textureName: {
        value: selectedTexture,
        options: material ? getAvailableTextureNames(material) : [],
        onChange: (value) => {
          if (value) {
            setSelectedTexture(value);
          }
        },
      },
    }),
    [selectedMaterial, selectedTexture, model]
  );

  useEffect(() => {
    set({ materialName: selectedMaterial, textureName: selectedTexture });
  }, [selectedMaterial, selectedTexture, model]);

  useEffect(() => {
    if (!texture) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(texture.image, 0, 0);
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
