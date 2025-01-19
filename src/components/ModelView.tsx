import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { useModelStore } from "../stores/useModelStore";

interface ModelViewProps {
  url: string;
}

export default function ModelView({ url }: ModelViewProps) {
  console.log("Loading glTF model...", url);
  const gltf = useGLTF(url);
  const setModel = useModelStore((state) => state.setModel);

  useEffect(() => {
    setModel(gltf);
  }, [gltf, setModel]);

  return (
    <div id="view-3d">
      <Canvas>
        <Environment preset="studio" />
        <primitive object={gltf.scene} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
