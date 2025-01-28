import { useCallback, useState } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import ModelView from "./components/ModelView";
import TextureView from "./components/TextureView";

function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const onDrop = useCallback(async <T extends File>(acceptedFiles: T[]) => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      setModelUrl(url);
    }
  }, []);

  return (
    <>
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
          <Dropzone onDrop={onDrop} />
        </>
      )}
    </>
  );
}

export default App;
