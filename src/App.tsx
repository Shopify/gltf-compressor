import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  }, []);

  return (
    <>
      {!modelUrl && <Dropzone onDrop={handleDrop} />}
      <div id="view-3d">
        {modelUrl ? (
          <Canvas>
            <Environment preset="studio" />
            <Model url={modelUrl} />
            <OrbitControls />
          </Canvas>
        ) : (
          <p>{isDragging ? "Drop it in!" : "Drag a glTF file here"}</p>
        )}
      </div>
    </>
  );
}

export default App;
