import { useModelStore } from "@/stores/useModelStore";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Grid } from "../custom_drei_components/Grid";
import { Stage } from "../custom_drei_components/Stage";

export default function ModelView() {
  const { scene } = useModelStore();

  if (!scene) return null;

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage
            preset={"rembrandt"}
            intensity={1}
            adjustCamera
            environment={"city"}
          >
            <primitive object={scene} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault />
        <Grid />
      </Canvas>
    </div>
  );
}
