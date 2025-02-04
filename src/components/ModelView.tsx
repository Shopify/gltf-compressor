import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Grid } from "../custom_drei_components/Grid";
import { Stage } from "../custom_drei_components/Stage";

export default function ModelView() {
  const { scene } = useModelStore();
  const { autoRotate } = useViewportStore();

  if (!scene) return null;

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage>
            <primitive object={scene} />
          </Stage>
        </Suspense>
        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={-1}
        />
        <Grid />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
