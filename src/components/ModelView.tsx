import { useModelStore } from "@/stores/useModelStore";
import { updateModel } from "@/utils/utils";
import { Bounds, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";

interface ModelViewProps {
  url: string;
}

export default function ModelView({ url }: ModelViewProps) {
  const gltf = useGLTF(url);
  const setModel = useModelStore((state) => state.setModel);

  const { model, compressionSettings } = useModelStore();

  useEffect(() => {
    console.log("Loading glTF model...", url);
  }, [url]);

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
      <Canvas>
        <Environment preset="studio" />
        <Bounds fit clip>
          <primitive object={gltf.scene} />
        </Bounds>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
