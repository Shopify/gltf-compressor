import { easings, useSpring } from "@react-spring/web";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Material, Mesh, WebGLProgramParametersWithUniforms } from "three";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import {
  applyMaterialHighlighting,
  findMeshesByMaterial,
} from "@/utils/materialHighlighting";

export default function MaterialHighlighter() {
  // Track glowing meshes and their original materials
  const glowingMeshes = useRef<Map<Mesh, Material | Material[]>>(new Map());

  const originalSceneGlowShaderRefs = useRef<
    WebGLProgramParametersWithUniforms[]
  >([]);
  const modifiedSceneGlowShaderRefs = useRef<
    WebGLProgramParametersWithUniforms[]
  >([]);

  const [fadeSpring, fadeSpringAPI] = useSpring(() => ({
    from: { progress: 0.0 },
    config: {
      easing: easings.easeOutCubic,
      duration: 500,
    },
    onChange: () => {
      const currProgress = fadeSpring.progress.get();
      originalSceneGlowShaderRefs.current.forEach((shader) => {
        shader.uniforms.progress.value = currProgress;
      });
      modifiedSceneGlowShaderRefs.current.forEach((shader) => {
        shader.uniforms.progress.value = currProgress;
      });
    },
    onRest: () => {
      if (fadeSpring.progress.get() === 0.0) {
        // Restore meshes to their original materials
        glowingMeshes.current.forEach((originalMaterial, mesh) => {
          mesh.material = originalMaterial;
        });

        // Clear the tracking map
        glowingMeshes.current.clear();
      }
    },
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        originalDocument,
        modifiedDocument,
        originalDocumentView,
        modifiedDocumentView,
        originalScene,
        modifiedScene,
        selectedMaterial,
      } = useModelStore.getState();

      if (
        !originalDocument ||
        !modifiedDocument ||
        !originalDocumentView ||
        !modifiedDocumentView ||
        !originalScene ||
        !modifiedScene ||
        !selectedMaterial
      ) {
        return;
      }

      if (event.code === "KeyX" && !event.repeat) {
        event.preventDefault();

        // Restore meshes to their original materials
        glowingMeshes.current.forEach((originalMaterial, mesh) => {
          mesh.material = originalMaterial;
        });

        // Clear the tracking map
        glowingMeshes.current.clear();

        // Find the index of the selected material in the original document
        const originalMaterials = originalDocument.getRoot().listMaterials();
        const materialIndex = originalMaterials.indexOf(selectedMaterial);
        let modifiedMaterial = null;
        if (materialIndex !== -1) {
          // Get the corresponding material from the modified document
          const modifiedMaterials = modifiedDocument.getRoot().listMaterials();
          modifiedMaterial = modifiedMaterials[materialIndex];
        }

        if (!modifiedMaterial) {
          return;
        }

        // Find meshes that use the selected material in the original and modified scenes
        const originalMeshesWithMaterial = findMeshesByMaterial(
          originalDocumentView,
          selectedMaterial,
          originalScene
        );
        const modifiedMeshesWithMaterial = findMeshesByMaterial(
          modifiedDocumentView,
          modifiedMaterial,
          modifiedScene
        );

        const modelDimensions = useViewportStore.getState().modelDimensions;

        // Highlight meshes in the original and modified scenes
        applyMaterialHighlighting(
          originalMeshesWithMaterial,
          originalSceneGlowShaderRefs,
          glowingMeshes,
          modelDimensions
        );
        applyMaterialHighlighting(
          modifiedMeshesWithMaterial,
          modifiedSceneGlowShaderRefs,
          glowingMeshes,
          modelDimensions
        );

        fadeSpringAPI.start({ to: { progress: 1.0 } });

        useViewportStore.setState({ showConfetti: false });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const { originalScene, modifiedScene, selectedMaterial } =
        useModelStore.getState();

      if (!originalScene || !modifiedScene || !selectedMaterial) {
        return;
      }

      if (event.code === "KeyX") {
        event.preventDefault();

        fadeSpringAPI.start({ to: { progress: 0.0 } });

        useViewportStore.setState({ showConfetti: false });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [fadeSpringAPI]);

  useFrame((state) => {
    originalSceneGlowShaderRefs.current.forEach((shader) => {
      shader.uniforms.time.value = state.clock.elapsedTime;
      shader.uniforms.progress.value = fadeSpring.progress.get();
    });

    modifiedSceneGlowShaderRefs.current.forEach((shader) => {
      shader.uniforms.time.value = state.clock.elapsedTime;
      shader.uniforms.progress.value = fadeSpring.progress.get();
    });
  });

  return null;
}
