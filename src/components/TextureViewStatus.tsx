import { Material, Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { TextureBounds, TextureCompressionSettings } from "@/types/types";

export default function TextureViewStatus() {
  const statusMessageRef = useRef<HTMLDivElement>(null);
  const dotAnimationIntervalRef = useRef<number | null>(null);
  const currentDotsRef = useRef<number>(0);

  const startDotAnimation = (baseMessage: string) => {
    if (dotAnimationIntervalRef.current !== null) {
      clearInterval(dotAnimationIntervalRef.current);
    }

    currentDotsRef.current = 0;

    const updateDots = () => {
      if (!statusMessageRef.current) return;

      const visibleDots = ".".repeat(currentDotsRef.current);
      const invisibleDots = ".".repeat(3 - currentDotsRef.current);
      statusMessageRef.current.innerHTML = `<span>${baseMessage}${visibleDots}<span style="visibility:hidden">${invisibleDots}</span></span>`;

      currentDotsRef.current = (currentDotsRef.current + 1) % 4;
    };

    updateDots();

    dotAnimationIntervalRef.current = window.setInterval(updateDots, 250);
  };

  const stopDotAnimation = () => {
    if (dotAnimationIntervalRef.current !== null) {
      clearInterval(dotAnimationIntervalRef.current);
      dotAnimationIntervalRef.current = null;
    }
  };

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
          startDotAnimation(
            `Processing Texture ${bulkProcessingProgress.current}/${bulkProcessingProgress.total}`
          );
          statusMessageRef.current.style.display = "block";
        } else if (isCompressing) {
          startDotAnimation("Updating Texture");
          statusMessageRef.current.style.display = "block";
        } else if (!selectedMaterial) {
          stopDotAnimation();
          statusMessageRef.current.innerHTML =
            "<span>No Material Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else if (selectedMaterial && !selectedTexture) {
          stopDotAnimation();
          statusMessageRef.current.innerHTML =
            "<span>No Texture Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else {
          stopDotAnimation();
          statusMessageRef.current.style.display = "none";
        }
      },
      { fireImmediately: true, equalityFn: shallow }
    );

    return () => {
      unsubscribe();
      stopDotAnimation();
    };
  }, []);

  return <div ref={statusMessageRef} id="texture-view-status" />;
}
