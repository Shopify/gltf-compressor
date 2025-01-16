import { Suspense, useCallback, useState } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import ModelStats from "./components/ModelStats";
import ModelView from "./components/ModelView";

function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedModel, setLoadedModel] = useState(null);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  }, []);

  const handleModelLoaded = useCallback((model: any) => {
    setLoadedModel(model);
  }, []);

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          Loading...
        </div>
      }
    >
      {modelUrl ? (
        <>
          {loadedModel && <ModelStats model={loadedModel} />}
          <ModelView url={modelUrl} onModelLoaded={handleModelLoaded} />
        </>
      ) : (
        <>
          <Dropzone onDrop={handleDrop} />
          <p id="drop-message">
            {isDragging ? "Drop it in!" : "Drag a glTF file here"}
          </p>
        </>
      )}
    </Suspense>
  );
}

export default App;
