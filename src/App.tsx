import { useCallback } from "react";
import { Dropzone } from "./components/Dropzone";
import ModelView from "./components/ModelView";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import TextureView from "./components/TextureView";
import { useModelStore } from "./stores/useModelStore";
import { createDocuments } from "./utils/documentUtils";
import { buildTextureCompressionSettings } from "./utils/utils";

function App() {
  const { originalDocument, setInitialModelStats, selectedTexture } = useModelStore();

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

        setInitialModelStats();
      }
    }
  }, []);

  return (
    <>
      {originalDocument ? (
        <div className="flex h-full">
          <div className={`${selectedTexture ? 'w-[40%]' : 'w-[80%]'} h-full`}>
            <ModelView />
          </div>
          {selectedTexture && (
            <div className="w-[40%] h-full">
              <TextureView />
            </div>
          )}
          <div className="w-[20%] h-full overflow-y-auto">
            <SettingsView />
          </div>
          <StatsView />
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <img src="/logo.svg" alt="Logo" className="w-20 h-20" />
          </div>
        </div>
      ) : (
        <Dropzone onDrop={onDrop} />
      )}
    </>
  );
}

export default App;
