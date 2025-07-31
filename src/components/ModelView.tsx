import { GizmoHelper, GizmoViewport, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { Group } from "three";
import { useShallow } from "zustand/react/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";

import { Preload } from "@react-three/drei";
import CameraControls from "./CameraControls";
import Confetti from "./Confetti";
import { Grid } from "./drei/Grid";
import { Stage } from "./drei/Stage";
import MaterialHighlighter from "./MaterialHighlighter";

export default function ModelView() {
  const [originalScene, modifiedScene] = useModelStore(
    useShallow((state) => [state.originalScene, state.modifiedScene])
  );

  useEffect(() => {
    if (!originalScene || !modifiedScene) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalScene.traverse((child: any) => {
      if (
        child.isMesh &&
        child.material.name === "__DefaultMaterial" &&
        !child.geometry.attributes.normal
      ) {
        child.geometry.computeVertexNormals();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modifiedScene.traverse((child: any) => {
      if (
        child.isMesh &&
        child.material.name === "__DefaultMaterial" &&
        !child.geometry.attributes.normal
      ) {
        child.geometry.computeVertexNormals();
      }
    });
  }, [originalScene, modifiedScene]);

  const originalSceneRef = useRef<Group | null>(null);
  const modifiedSceneRef = useRef<Group | null>(null);

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

  if (!originalScene || !modifiedScene) return null;

  return (
    <div id="model-view">
      <Canvas
        camera={{ position: [0, 0, 150], fov: 50, near: 0.1, far: 1000 }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
        }}
      >
        <color attach="background" args={["#444444"]} />
        <Suspense
          fallback={
            <Html center>
              <span id="model-view-fallback">Loading Model...</span>
            </Html>
          }
        >
          <Stage>
            <primitive
              ref={originalSceneRef}
              object={originalScene}
              visible={false}
            />
            <primitive ref={modifiedSceneRef} object={modifiedScene} visible />
          </Stage>
          <Grid />
          <Preload all />
        </Suspense>
        <CameraControls />
        <GizmoHelper alignment="bottom-right" margin={[63.5, 63.5]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
        <MaterialHighlighter />
        <Confetti />
      </Canvas>
    </div>
  );
}
