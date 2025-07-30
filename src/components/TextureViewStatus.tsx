import { Material, Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { TextureBounds, TextureCompressionSettings } from "@/types/types";

export default function TextureViewStatus() {
  const statusMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = useModelStore.subscribe(
      (state) => [
        state.selectedMaterial,
        state.selectedTexture,
        state.textureCompressionSettingsMap,
        state.textureBounds,
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

        if (isCompressing) {
          statusMessageRef.current.innerHTML =
            "<span>Updating Texture...</span>";
          statusMessageRef.current.style.display = "block";
        } else if (!selectedMaterial) {
          statusMessageRef.current.innerHTML =
            "<span>No Material Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else if (selectedMaterial && !selectedTexture) {
          statusMessageRef.current.innerHTML =
            "<span>No Texture Selected</span>";
          statusMessageRef.current.style.display = "block";
        } else {
          statusMessageRef.current.style.display = "none";
        }
      },
      { fireImmediately: true, equalityFn: shallow }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return <div ref={statusMessageRef} id="texture-view-status" />;
}
