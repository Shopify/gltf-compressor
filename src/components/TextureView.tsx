import { Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { TextureCompressionSettings } from "@/types/types";
import { loadTexture } from "@/utils/textureLoading";

export default function TextureView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(
    document.createElement("canvas")
  );
  const ktx2LoaderRef = useRef<KTX2Loader | null>(null);

  useEffect(() => {
    const unsubscribe = useModelStore.subscribe(
      (state) => [
        state.selectedTexture,
        state.textureCompressionSettingsMap,
        state.texturesBeingCompressed,
      ],
      (newState) => {
        if (!canvasRef.current || !offscreenCanvasRef.current) return;

        const selectedTexture = newState[0] as Texture | null;
        const textureCompressionSettingsMap = newState[1] as Map<
          Texture,
          TextureCompressionSettings
        >;
        const texturesBeingCompressed = newState[2] as Set<Texture>;

        const showModifiedDocument =
          useViewportStore.getState().showModifiedDocument;

        const isCompressing =
          selectedTexture && texturesBeingCompressed.has(selectedTexture);
        const textureCanBeDisplayed = selectedTexture && !isCompressing;

        canvasRef.current.style.display = textureCanBeDisplayed
          ? "block"
          : "none";

        if (textureCanBeDisplayed) {
          loadTexture(
            selectedTexture,
            textureCompressionSettingsMap,
            showModifiedDocument,
            canvasRef.current,
            offscreenCanvasRef.current,
            ktx2LoaderRef
          );
        }
      },
      { fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.showModifiedDocument,
      (showModifiedDocument) => {
        if (!canvasRef.current || !offscreenCanvasRef.current) return;

        const {
          selectedTexture,
          textureCompressionSettingsMap,
          texturesBeingCompressed,
        } = useModelStore.getState();

        const isCompressing =
          selectedTexture && texturesBeingCompressed.has(selectedTexture);
        const textureCanBeDisplayed = selectedTexture && !isCompressing;

        canvasRef.current.style.display = textureCanBeDisplayed
          ? "block"
          : "none";

        if (textureCanBeDisplayed) {
          loadTexture(
            selectedTexture,
            textureCompressionSettingsMap,
            showModifiedDocument,
            canvasRef.current,
            offscreenCanvasRef.current,
            ktx2LoaderRef
          );
        }
      },
      { fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Texture view"
      style={{
        display: "none",
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  );
}
