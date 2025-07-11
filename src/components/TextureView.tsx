import { useModelStore } from "@/stores/useModelStore";
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
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = size[0];
            tempCanvas.height = size[1];
            const renderer = new WebGLRenderer({ canvas: tempCanvas });

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
                const aspectRatio = size[0] / size[1];
                const camera = new OrthographicCamera(
                  -1 * aspectRatio,
                  1 * aspectRatio,
                  1,
                  -1,
                  0,
                  1
                );
                const geometry = new PlaneGeometry(2 * aspectRatio, 2);
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
                console.error("Failed to load KTX2 texture: ", error);
                renderer.dispose();
                URL.revokeObjectURL(blobUrl);
              }
            );
          } catch (error) {
            console.error("Failed to load KTX2 texture: ", error);
          }
        } else {
          // Handle regular image formats (JPEG, PNG, WEBP)
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
