import { useModelStore } from "@/stores/useModelStore";
import { useEffect, useRef } from "react";

export default function TextureView() {
  const { selectedTexture, compressionSettings } = useModelStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadTexture = async () => {
      if (!selectedTexture) return;

      const texture =
        compressionSettings?.textures.get(selectedTexture)?.compressed;

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
  }, [selectedTexture]);

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
