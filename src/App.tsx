import { useCallback, useState } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import ModelView from "./components/ModelView";
import StatsView from "./components/StatsView";
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
          <div className="grid grid-cols-2 h-full">
            <ModelView url={modelUrl} />
            <TextureView />
            <StatsView url={modelUrl} />
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
