import { useModelStore } from "@/stores/useModelStore";
import { read } from "ktx-parse";
import { useEffect, useRef } from "react";
import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export default function TextureView() {
  const {
    selectedMaterial,
    selectedTexture,
    textureCompressionSettingsMap,
    texturesBeingCompressed,
    showingCompressedTexture,
  } = useModelStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ktx2LoaderRef = useRef<KTX2Loader | null>(null);
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
        // Handle KTX2 textures
        if (mimeType === "image/ktx2") {
          try {
            // First, try to parse the KTX2 file with ktx-parse
            const ktxContainer = read(imageData);
            console.log("KTX2 container:", ktxContainer);

            // Try Three.js KTX2Loader first
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = size[0];
            tempCanvas.height = size[1];
            const renderer = new WebGLRenderer({ canvas: tempCanvas });

            // Create or reuse KTX2Loader instance
            if (!ktx2LoaderRef.current) {
              ktx2LoaderRef.current = new KTX2Loader();
              ktx2LoaderRef.current.setTranscoderPath(
                "https://unpkg.com/three@0.172.0/examples/jsm/libs/basis/"
              );
            }
            ktx2LoaderRef.current.detectSupport(renderer);

            const blob = new Blob([imageData], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            ktx2LoaderRef.current.load(
              blobUrl,
              (threeTexture) => {
                threeTexture.colorSpace = SRGBColorSpace;
                const scene = new Scene();
                const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const geometry = new PlaneGeometry(2, 2);
                const material = new MeshBasicMaterial({ map: threeTexture });
                const mesh = new Mesh(geometry, material);
                scene.add(mesh);

                renderer.render(scene, camera);

                const renderedImageData = renderer.domElement.toDataURL();
                const img = new Image();
                img.onload = () => {
                  ctx.save();
                  // Flip the image vertically by scaling Y by -1
                  ctx.scale(1, -1);
                  ctx.drawImage(img, 0, -canvas.height);
                  ctx.restore();
                  renderer.dispose();
                  URL.revokeObjectURL(blobUrl);
                };
                img.src = renderedImageData;
              },
              undefined,
              (error) => {
                console.error("Three.js KTX2Loader failed:", error);
                // Fallback: Show KTX2 info using ktx-parse
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "black";
                ctx.font = "14px monospace";
                ctx.textAlign = "left";

                const info = [
                  `KTX2 Container Info:`,
                  `Format: ${ktxContainer.vkFormat}`,
                  `Width: ${ktxContainer.pixelWidth}`,
                  `Height: ${ktxContainer.pixelHeight}`,
                  `Levels: ${ktxContainer.levels.length}`,
                  `Supercompression: ${ktxContainer.supercompressionScheme}`,
                  ``,
                  `Preview not available - KTX2 requires`,
                  `transcoder files for display`,
                ];

                info.forEach((line, i) => {
                  ctx.fillText(line, 10, 20 + i * 16);
                });

                renderer.dispose();
                URL.revokeObjectURL(blobUrl);
              }
            );
          } catch (error) {
            console.error("Error handling KTX2 texture:", error);
            // Final fallback
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "red";
            ctx.font = "16px monospace";
            ctx.textAlign = "center";
            ctx.fillText(
              "KTX2 texture format not supported",
              canvas.width / 2,
              canvas.height / 2
            );
          }
        } else {
          // Handle regular image formats (JPEG, PNG, WebP)
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
      }
    };

    loadTexture();
  }, [
    selectedTexture,
    textureCompressionSettingsMap,
    isCompressing,
    showingCompressedTexture,
  ]);

  // Cleanup KTX2Loader on unmount
  useEffect(() => {
    return () => {
      if (ktx2LoaderRef.current) {
        ktx2LoaderRef.current.dispose();
        ktx2LoaderRef.current = null;
      }
    };
  }, []);

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
      {!selectedMaterial && (
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
          <span>No material selected</span>
        </div>
      )}
      {selectedMaterial && !selectedTexture && (
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
