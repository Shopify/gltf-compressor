import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Group, Material, Plane, PointsMaterial, Vector3 } from "three";
import { useShallow } from "zustand/react/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";

import { easings, useSpring } from "@react-spring/web";
import { Preload } from "@react-three/drei";
import CameraControls from "./CameraControls";
import Confetti from "./Confetti";
import { Grid } from "./drei/Grid";
import { Stage } from "./drei/Stage";
import { Hologram } from "./Hologram";
import MaterialHighlighter from "./MaterialHighlighter";

export default function ModelView() {
  const [originalScene, modifiedScene] = useModelStore(
    useShallow((state) => [state.originalScene, state.modifiedScene])
  );

  const originalSceneRef = useRef<Group | null>(null);
  const modifiedSceneRef = useRef<Group | null>(null);

  // Toggle the visibility of the original scene and the modified scene when the C key is pressed/released
  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.showModifiedDocument,
      (showModifiedDocument) => {
        if (originalSceneRef.current) {
          originalSceneRef.current.visible = !showModifiedDocument;
        }
        if (modifiedSceneRef.current) {
          modifiedSceneRef.current.visible = showModifiedDocument;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const fallbackRef = useRef<HTMLDivElement>(null);
  const hologramRef = useRef<{ playAnimation: () => void } | null>(null);
  const gridRef = useRef<{ playAnimation: () => void } | null>(null);

  const originalSceneMaterialsRef = useRef<Material[]>([]);
  const modifiedSceneMaterialsRef = useRef<Material[]>([]);
  const modelHeightRef = useRef<number>(0);

  const clippingPlane: Plane[] = useMemo(() => {
    return [new Plane(new Vector3(0, -1, 0), 0.0)];
  }, []);

  const [revealSpring, revealSpringAPI] = useSpring(
    () => ({
      from: { progress: 0.0 },
      config: {
        easing: easings.easeOutCubic,
        duration: 1000,
      },
      onStart: () => {
        // Show the modified scene for the first time
        if (modifiedSceneRef.current) {
          modifiedSceneRef.current.visible = true;
        }
      },
      onChange: () => {
        if (!originalScene || !modifiedScene) {
          return;
        }

        // Move the clipping plane from the bottom of the model to the top
        const modelHeight = modelHeightRef.current;
        clippingPlane[0].constant =
          -modelHeight * 0.5 + revealSpring.progress.get() * modelHeight;

        // Apply the clipping plane to the original scene and the modified scene
        originalSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = clippingPlane;
        });
        modifiedSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = clippingPlane;
        });
      },
      onRest: () => {
        if (!originalScene || !modifiedScene) {
          return;
        }

        // Remove the clipping plane from the original scene and the modified scene
        originalSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = [];
        });
        modifiedSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = [];
        });
      },
    }),
    [originalScene, modifiedScene, clippingPlane]
  );

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.revealScene,
      (revealScene) => {
        if (revealScene) {
          originalSceneMaterialsRef.current = [];
          modifiedSceneMaterialsRef.current = [];

          // Store the materials in refs so we don't have to traverse the scene every frame while the reveal spring is running
          // Also compute vertex normals for models that don't have them and that use the default material of gltf-transform
          // If we don't do this, those models render completely black
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          originalScene?.traverse((child: any) => {
            // The ContactShadows component uses scene.overrideMaterial to render the shadows using a MeshDepthMaterial
            // That material doesn't render points correctly, which results in flickering artifacts in the shadow plane
            // We disable the override material for points materials to avoid this issue
            if (child.material instanceof PointsMaterial) {
              child.material.allowOverride = false;
            }

            if (child.isMesh && child.material) {
              if (
                child.material.name === "__DefaultMaterial" &&
                !child.geometry.attributes.normal
              ) {
                child.geometry.computeVertexNormals();
              }

              originalSceneMaterialsRef.current.push(child.material);
            }
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          modifiedScene?.traverse((child: any) => {
            // The ContactShadows component uses scene.overrideMaterial to render the shadows using a MeshDepthMaterial
            // That material doesn't render points correctly, which results in flickering artifacts in the shadow plane
            // We disable the override material for points materials to avoid this issue
            if (child.material instanceof PointsMaterial) {
              child.material.allowOverride = false;
            }

            if (child.isMesh && child.material) {
              if (
                child.material.name === "__DefaultMaterial" &&
                !child.geometry.attributes.normal
              ) {
                child.geometry.computeVertexNormals();
              }

              modifiedSceneMaterialsRef.current.push(child.material);
            }
          });

          modelHeightRef.current =
            useViewportStore.getState().modelDimensions?.[1] ?? 0;

          // Hide the fallback text
          if (fallbackRef.current) {
            fallbackRef.current.style.display = "none";
          }

          // Reveal the modified scene by animating a clipping plane from the bottom of the model to the top
          if (hologramRef.current) {
            hologramRef.current.playAnimation();
          }
          if (gridRef.current) {
            gridRef.current.playAnimation();
          }
          revealSpringAPI.start({
            to: { progress: 1.0 },
            delay: 1000,
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [originalScene, modifiedScene, revealSpringAPI]);

  if (!originalScene || !modifiedScene) return null;

  return (
    <div id="model-view">
      <Canvas
        camera={{ position: [0, 0, 150], fov: 50, near: 0.1, far: 1000 }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          localClippingEnabled: true,
        }}
      >
        <color attach="background" args={["#444444"]} />
        <Suspense fallback={null}>
          <Stage>
            <primitive
              ref={originalSceneRef}
              object={originalScene}
              visible={false}
            />
            <primitive
              ref={modifiedSceneRef}
              object={modifiedScene}
              visible={false}
            />
          </Stage>
          <Hologram ref={hologramRef} />
          <Grid ref={gridRef} />
          <CameraControls />
          <MaterialHighlighter />
          <Confetti />
          <Preload all />
        </Suspense>
        <GizmoHelper alignment="bottom-right" margin={[63.5, 63.5]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
      <div id="model-view-fallback" ref={fallbackRef}>
        <span>Loading Model...</span>
      </div>
    </div>
  );
}
