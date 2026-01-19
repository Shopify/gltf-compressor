import { Material, Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";

import { useDotAnimation } from "@/hooks/useDotAnimation";
import { useDynamicDotAnimation } from "@/hooks/useDynamicDotAnimation";
import { useModelStore } from "@/stores/useModelStore";
import { TextureBounds, TextureCompressionSettings } from "@/types/types";

enum AnimationState {
  IDLE = 0,
  BULK_PROCESSING = 1,
  COMPRESSING = 2,
}

export default function TextureViewStatus() {
  const statusMessageRef = useRef<HTMLDivElement>(null);
  const { startAnimation, stopAnimation } = useDotAnimation(250);
  const {
    startAnimation: startBulkAnimation,
    updateMessage: updateBulkMessage,
    stopAnimation: stopBulkAnimation,
  } = useDynamicDotAnimation(250);
  const currentStateRef = useRef<AnimationState>(AnimationState.IDLE);

  useEffect(() => {
    const unsubscribe = useModelStore.subscribe(
      (state) => [
        state.selectedMaterial,
        state.selectedTexture,
        state.textureCompressionSettingsMap,
        state.textureBounds,
        state.isBulkProcessing,
        state.bulkProcessingProgress,
      ],
      (newState) => {
        if (!statusMessageRef.current) {
          return;
        }

        const selectedMaterial = newState[0] as Material | null;
        const selectedTexture = newState[1] as Texture | null;
        const textureCompressionSettingsMap = newState[2] as Map<
          Texture,
          TextureCompressionSettings
        >;
        const textureBounds = newState[3] as TextureBounds | null;
        const isBulkProcessing = newState[4] as boolean;
        const bulkProcessingProgress = newState[5] as {
          current: number;
          total: number;
        } | null;

        const isCompressing =
          selectedTexture !== null &&
          (textureCompressionSettingsMap.get(selectedTexture)
            ?.isBeingCompressed ??
            false);

        // Position the status message
        if (textureBounds) {
          const top = textureBounds.statusShouldBeAboveBottomEdge
            ? // 32px above bottom edge of canvas
              window.innerHeight - 32
            : // 16px below bottom edge of texture
              textureBounds.bottom + 16;

          statusMessageRef.current.style.left = `${textureBounds.left + textureBounds.width / 2}px`;
          statusMessageRef.current.style.top = `${top}px`;
          statusMessageRef.current.style.transform = "translateX(-50%)";
        } else {
          // Fallback to center positioning if no texture bounds are available
          statusMessageRef.current.style.left = "50%";
          statusMessageRef.current.style.top = "50%";
          statusMessageRef.current.style.transform = "translate(-50%, -50%)";
        }

        if (isBulkProcessing && bulkProcessingProgress) {
          if (currentStateRef.current !== AnimationState.BULK_PROCESSING) {
            currentStateRef.current = AnimationState.BULK_PROCESSING;
            stopAnimation();
            startBulkAnimation(
              statusMessageRef.current,
              `Processing Texture ${bulkProcessingProgress.current}/${bulkProcessingProgress.total}`
            );
          } else {
            updateBulkMessage(
              `Processing Texture ${bulkProcessingProgress.current}/${bulkProcessingProgress.total}`
            );
          }
          statusMessageRef.current.style.display = "block";
        } else if (isCompressing) {
          if (currentStateRef.current !== AnimationState.COMPRESSING) {
            currentStateRef.current = AnimationState.COMPRESSING;
            stopBulkAnimation();
            startAnimation(statusMessageRef.current, "Updating Texture");
          }
          statusMessageRef.current.style.display = "block";
        } else if (!selectedMaterial) {
          currentStateRef.current = AnimationState.IDLE;
          stopAnimation();
          stopBulkAnimation();
          statusMessageRef.current.innerHTML =
            "<span>No Material Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else if (selectedMaterial && !selectedTexture) {
          currentStateRef.current = AnimationState.IDLE;
          stopAnimation();
          stopBulkAnimation();
          statusMessageRef.current.innerHTML =
            "<span>No Texture Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else {
          currentStateRef.current = AnimationState.IDLE;
          stopAnimation();
          stopBulkAnimation();
          statusMessageRef.current.style.display = "none";
        }
      },
      { fireImmediately: true, equalityFn: shallow }
    );

    return () => {
      unsubscribe();
      stopAnimation();
      stopBulkAnimation();
    };
  }, [startAnimation, stopAnimation, startBulkAnimation, updateBulkMessage, stopBulkAnimation]);

  return <div ref={statusMessageRef} id="texture-view-status" />;
}
