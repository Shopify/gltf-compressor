import { VIEWPORT_FOLDER_ORDER } from "@/constants";
import { useViewportStore } from "@/stores/useViewportStore";
import { useControls } from "leva";

export default function ViewportSettingsPanel() {
  const { setLightingPreset, setEnvironmentPreset } = useViewportStore();

  useControls(
    "Viewport",
    {
      lightingPreset: {
        value: "rembrandt",
        options: ["rembrandt", "portrait", "upfront", "soft"],
        onChange: (value) => setLightingPreset(value),
      },
      environmentPreset: {
        value: "city",
        options: [
          "apartment",
          "city",
          "dawn",
          "forest",
          "lobby",
          "night",
          "park",
          "studio",
          "sunset",
          "warehouse",
        ],
        onChange: (value) => setEnvironmentPreset(value),
      },
    },
    { collapsed: false, order: VIEWPORT_FOLDER_ORDER }
  );

  return null;
}
