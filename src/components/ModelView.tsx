import { useModelStore } from "@/stores/useModelStore";
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
  const { materials } = model || {};

  useEffect(() => {
    console.log("Loading glTF model...", url);
  }, [url]);

  useEffect(() => {
    setModel(gltf);
  }, [gltf, setModel]);

  useEffect(() => {
    if (compressionSettings) {
      Object.entries(compressionSettings).forEach(
        ([materialName, textures]) => {
          Object.entries(textures).forEach(([textureName, settings]) => {
            materials[materialName][textureName] = settings.compressionEnabled
              ? ""
              : compressionSettings[materialName][textureName].original;
            materials[materialName].needsUpdate = true;
          });
        }
      );
    }
  }, [compressionSettings]);

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
