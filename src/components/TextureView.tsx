import { useModelStore } from "@/stores/useModelStore";
import { useEffect, useRef } from "react";

export default function TextureView() {
  const { selectedTexture, compressionSettings, compressingTextures } =
    useModelStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCompressing =
    selectedTexture && compressingTextures.has(selectedTexture);

  useEffect(() => {
    const loadTexture = async () => {
      if (!selectedTexture || isCompressing) return;

      const textureSettings =
        compressionSettings?.textures.get(selectedTexture);

      // Show compressed texture if compression is enabled and available, otherwise show original
      const texture =
        textureSettings?.compressionEnabled && textureSettings?.compressed
          ? textureSettings.compressed
          : selectedTexture;

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
  }, [selectedTexture, compressionSettings, isCompressing]);

  return (
    <div
      id="texture-view"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: selectedTexture && !isCompressing ? "block" : "none",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {isCompressing && (
        <div
          style={{
            color: "white",
            fontSize: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <span>Compressing texture...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
