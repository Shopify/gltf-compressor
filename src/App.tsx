import { useCallback } from "react";
import { Dropzone } from "./components/Dropzone";
import ModelView from "./components/ModelView";
import SettingsView from "./components/SettingsView";
import TextureView from "./components/TextureView";
import { useModelStore } from "./stores/useModelStore";
import { createDocuments } from "./utils/documentUtils";
import { buildTextureCompressionSettings } from "./utils/utils";

function App() {
  const { originalDocument } = useModelStore();
  const onDrop = useCallback(async <T extends File>(acceptedFiles: T[]) => {
    if (acceptedFiles[0]) {
      const url = URL.createObjectURL(acceptedFiles[0]);
      if (url) {
        const { originalDocument, modifiedDocument, sceneView } =
          await createDocuments(url);

        const compressionSettings = buildTextureCompressionSettings(
          originalDocument,
          modifiedDocument
        );

        useModelStore.setState({
          originalDocument,
          modifiedDocument,
          compressionSettings,
          scene: sceneView,
        });
      }
    }
  }, []);

  return (
    <>
      {originalDocument ? (
        <div className="grid grid-cols-2 h-full">
          <ModelView />
          <TextureView />
          <SettingsView />
        </div>
      ) : (
        <Dropzone onDrop={onDrop} />
      )}
    </>
  );
}

export default App;
