import { Group, Panel, Separator } from "react-resizable-panels";

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
            <Group
              orientation="horizontal"
              onLayoutChange={() => {
                useViewportStore.setState({ isPanelResizing: true });
              }}
              onLayoutChanged={() => {
                useViewportStore.setState({ isPanelResizing: false });
              }}
            >
              <Panel
                defaultSize={66}
                minSize={0}
                onResize={(size) => {
                  useViewportStore.setState({ modelViewPanelSize: size.asPercentage });
                }}
              >
                <ModelView />
              </Panel>
              <Separator className="ResizeHandle">
                <div className="ResizeHandleThumb" data-direction="horizontal">
                  ⋮
                </div>
              </Separator>
              <Panel defaultSize={34} minSize={0}>
                <div id="texture-view-container">
                  <TextureView />
                  <TextureViewStatus />
                </div>
              </Panel>
            </Group>
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
