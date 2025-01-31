import { useCallback } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import { ExportPanel } from "./components/ExportPanel";
import ModelView from "./components/ModelView";
import StatsView from "./components/StatsView";
import TextureView from "./components/TextureView";
import { useModelStore } from "./stores/useModelStore";
import { createDocuments } from "./utils/documentUtils";

function App() {
  const { originalDocument, setDocuments } = useModelStore();
  const onDrop = useCallback(async <T extends File>(acceptedFiles: T[]) => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      if (url) {
        const { originalDocument, modifiedDocument, sceneView } =
          await createDocuments(url);
        setDocuments(originalDocument, modifiedDocument, sceneView);
      }
    }
  }, []);

  return (
    <>
      {originalDocument ? (
        <>
          <div className="grid grid-cols-2 h-full">
            <ModelView />
            <TextureView />
            <StatsView />
            <ExportPanel />
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
