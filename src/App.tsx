import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Dropzone } from "./components/Dropzone";
import Footer from "./components/Footer";
import ModelView from "./components/ModelView";
import SettingsView from "./components/SettingsView";
import StatsView from "./components/StatsView";
import TextureView from "./components/TextureView";
import TextureViewStatus from "./components/TextureViewStatus";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import { useModelStore } from "./stores/useModelStore";
import { useViewportStore } from "./stores/useViewportStore";

function App() {
  const originalDocument = useModelStore((state) => state.originalDocument);

  return (
    <ThemeProvider>
      {originalDocument ? (
        <div className="flex h-full">
          <div className="w-[80%] h-full">
            <PanelGroup direction="horizontal">
              <Panel
                defaultSize={66}
                minSize={0}
                onResize={(size) => {
                  useViewportStore.setState({ modelViewPanelSize: size });
                }}
              >
                <ModelView />
              </Panel>
              <PanelResizeHandle className="ResizeHandle">
                <div className="ResizeHandleThumb" data-direction="horizontal">
                  ⋮
                </div>
              </PanelResizeHandle>
              <Panel defaultSize={34} minSize={0}>
                <div id="texture-view-container">
                  <TextureView />
                  <TextureViewStatus />
                </div>
              </Panel>
            </PanelGroup>
          </div>
          <div className="w-[20%] h-full overflow-y-auto">
            <SettingsView />
          </div>
          <StatsView />
          <Footer />
        </div>
      ) : (
        <Dropzone />
      )}
      <Toaster position="top-center" richColors toastOptions={{}} />
    </ThemeProvider>
  );
}

export default App;
