import { Leva } from "leva";
import { useCallback } from "react";
import "./App.css";
import { Dropzone } from "./components/Dropzone";
import { ExportPanel } from "./components/ExportPanel";
import MaterialEditPanel from "./components/MaterialEditPanel";
import ModelView from "./components/ModelView";
import StatsView from "./components/StatsView";
import TextureView from "./components/TextureView";
import ViewportSettingsPanel from "./components/ViewportSettingsPanel";
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
        <>
          <Leva
            flat
            hideCopyButton
            theme={{
              sizes: {
                rootWidth: "300px",
                rowHeight: "20px",
                folderTitleHeight: "20px",
                titleBarHeight: "30px",
              },
              fontSizes: { root: "9px" },
              space: {
                sm: "5px",
                md: "7.5px",
                rowGap: "5px",
                colGap: "0px",
              },
            }}
            titleBar={{
              filter: false,
            }}
          />
          <div className="grid grid-cols-2 h-full">
            <ModelView />
            <TextureView />
            <StatsView />
            <ViewportSettingsPanel />
            <MaterialEditPanel />
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
