import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { GLTF } from "three-stdlib";

interface ModelViewProps {
  url: string;
  onModelLoaded?: (gltf: GLTF) => void;
}

export default function ModelView({ url, onModelLoaded }: ModelViewProps) {
  console.log("Loading glTF model...", url);
  const gltf = useGLTF(url);

  useEffect(() => {
    onModelLoaded?.(gltf);
  }, [gltf, onModelLoaded]);

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
