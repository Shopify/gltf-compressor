import { useModelStore } from "@/stores/useModelStore";
import { useEffect, useRef } from "react";

export default function TextureView() {
  const {
    selectedTexture,
    textureCompressionSettingsMap,
    texturesBeingCompressed,
    showingCompressedTexture,
  } = useModelStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCompressing =
    selectedTexture && texturesBeingCompressed.has(selectedTexture);

  useEffect(() => {
    const loadTexture = async () => {
      if (!selectedTexture || isCompressing) return;

      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);

      // Show compressed texture if compression is enabled and available, otherwise show original
      const texture =
        textureCompressionSettings?.compressionEnabled &&
        textureCompressionSettings?.compressedTexture
          ? textureCompressionSettings.compressedTexture
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
  }, [
    selectedTexture,
    textureCompressionSettingsMap,
    isCompressing,
    showingCompressedTexture,
  ]);

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
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>Updating texture...</span>
        </div>
      )}
      {!selectedTexture && (
        <div
          style={{
            color: "white",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>No texture selected</span>
        </div>
      )}
    </div>
  );
}
