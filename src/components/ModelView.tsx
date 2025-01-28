import { useModelStore } from "@/stores/useModelStore";
import { updateModel } from "@/utils/utils";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface ModelViewProps {
  url: string;
}

export default function ModelView({ url }: ModelViewProps) {
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const gltf = useGLTF(url);
  const { model, compressionSettings } = useModelStore();
  const setModel = useModelStore((state) => state.setModel);

  useEffect(() => {
    setModel(gltf);
  }, [gltf, setModel]);

  useEffect(() => {
    if (compressionSettings && model) {
      updateModel(model, compressionSettings, true);
    }
  }, [compressionSettings, model]);

  return (
    <div id="view-3d">
      <Canvas camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage
            // @ts-ignore
            controls={orbitControlsRef}
            preset={"rembrandt"}
            intensity={1}
            shadows={"contact"}
            adjustCamera
            environment={"city"}
          >
            <primitive object={gltf.scene} />
          </Stage>
        </Suspense>
        <OrbitControls ref={orbitControlsRef} />
      </Canvas>
    </div>
  );
}
