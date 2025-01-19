import { Suspense, useCallback, useState } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import ModelView from "./components/ModelView";
import TextureView from "./components/TextureView";

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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              height: "100vh",
            }}
          >
            <ModelView url={modelUrl} />
            <TextureView />
          </div>
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
