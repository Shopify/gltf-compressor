import { SuspenseFallback } from "@/components/SuspenseFallback";
import { useModelStore } from "@/stores/useModelStore";
import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Grid } from "../custom_drei_components/Grid";
import { Stage } from "../custom_drei_components/Stage";
import CameraControls from "./CameraControls";

export default function ModelView() {
  const { scene } = useModelStore();

  if (!scene) return null;

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={<SuspenseFallback />}>
          <Stage>
            <primitive object={scene} />
          </Stage>
          <Grid />
        </Suspense>
        <CameraControls />
        <GizmoHelper alignment="bottom-right" margin={[63.5, 63.5]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
