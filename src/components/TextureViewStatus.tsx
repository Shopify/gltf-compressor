import { Material, Texture } from "@gltf-transform/core";
import { useEffect, useRef } from "react";

import { useModelStore } from "@/stores/useModelStore";

export default function TextureViewStatus() {
  const statusMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = useModelStore.subscribe(
      (state) => [
        state.selectedMaterial,
        state.selectedTexture,
        state.texturesBeingCompressed,
      ],
      (newState) => {
        if (!statusMessageRef.current) {
          return;
        }

        const selectedMaterial = newState[0] as Material | null;
        const selectedTexture = newState[1] as Texture | null;
        const texturesBeingCompressed = newState[2] as Set<Texture>;

        const isCompressing =
          selectedTexture && texturesBeingCompressed.has(selectedTexture);

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
      { fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div
      ref={statusMessageRef}
      style={{
        display: "none",
        color: "white",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
        fontSize: "0.75rem",
        lineHeight: "1rem",
        whiteSpace: "nowrap",
      }}
    />
  );
}
