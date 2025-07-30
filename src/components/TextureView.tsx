import { Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { shallow } from "zustand/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { TextureCompressionSettings } from "@/types/types";
import { loadTexture } from "@/utils/textureLoading";
import { updateTextureBounds } from "@/utils/textureUtils";

export default function TextureView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(
    document.createElement("canvas")
  );
  const ktx2LoaderRef = useRef<KTX2Loader | null>(null);

  useEffect(() => {
    const unsubscribe = useModelStore.subscribe(
      (state) => [state.selectedTexture, state.textureCompressionSettingsMap],
      (newState) => {
        if (!canvasRef.current || !offscreenCanvasRef.current) return;

        const selectedTexture = newState[0] as Texture | null;
        const textureCompressionSettingsMap = newState[1] as Map<
          Texture,
          TextureCompressionSettings
        >;

        const showModifiedDocument =
          useViewportStore.getState().showModifiedDocument;

        const isCompressing =
          selectedTexture !== null &&
          (textureCompressionSettingsMap.get(selectedTexture)
            ?.isBeingCompressed ??
            false);
        const textureCanBeDisplayed =
          selectedTexture !== null && !isCompressing;

        if (textureCanBeDisplayed) {
          loadTexture(
            selectedTexture,
            textureCompressionSettingsMap,
            showModifiedDocument,
            canvasRef.current,
            offscreenCanvasRef.current,
            ktx2LoaderRef
          ).then(() => {
            updateTextureBounds(canvasRef.current, selectedTexture);
          });
        } else if (!selectedTexture) {
          canvasRef.current
            .getContext("2d")
            ?.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          updateTextureBounds(canvasRef.current, null);
        }
      },
      { fireImmediately: true, equalityFn: shallow }
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

        const { selectedTexture, textureCompressionSettingsMap } =
          useModelStore.getState();

        const isCompressing =
          selectedTexture !== null &&
          (textureCompressionSettingsMap.get(selectedTexture)
            ?.isBeingCompressed ??
            false);
        const textureCanBeDisplayed =
          selectedTexture !== null && !isCompressing;

        if (textureCanBeDisplayed) {
          loadTexture(
            selectedTexture,
            textureCompressionSettingsMap,
            showModifiedDocument,
            canvasRef.current,
            offscreenCanvasRef.current,
            ktx2LoaderRef
          );
        } else if (!selectedTexture) {
          canvasRef.current
            .getContext("2d")
            ?.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const { selectedTexture } = useModelStore.getState();
      updateTextureBounds(canvasRef.current, selectedTexture);
    };

    window.addEventListener("resize", handleResize);

    const unsubscribe = useViewportStore.subscribe(
      (state) => state.modelViewPanelSize,
      () => {
        handleResize();
      }
    );

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribe();
    };
  }, []);

  return <canvas ref={canvasRef} aria-label="Texture view" id="texture-view" />;
}
