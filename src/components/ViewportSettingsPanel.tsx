import { VIEWPORT_FOLDER_ORDER } from "@/constants";
import { useViewportStore } from "@/stores/useViewportStore";
import { useControls } from "leva";

export default function ViewportSettingsPanel() {
  const {
    setLightingPreset,
    setEnvironmentPreset,
    setLightIntensity,
    setContactShadows,
    setGrid,
    setAutoRotate,
  } = useViewportStore();

  useControls(
    "Viewport",
    {
      "Lighting Preset": {
        value: "rembrandt",
        options: ["rembrandt", "portrait", "upfront", "soft"],
        onChange: (value) => setLightingPreset(value),
      },
      "Environment Preset": {
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
      "Light Intensity": {
        value: 1,
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (value) => setLightIntensity(value),
      },
      "Contact Shadows": {
        value: true,
        onChange: (value) => setContactShadows(value),
      },
      Grid: {
        value: true,
        onChange: (value) => setGrid(value),
      },
      "Auto-Rotate": {
        value: false,
        onChange: (value) => setAutoRotate(value),
      },
    },
    { collapsed: false, order: VIEWPORT_FOLDER_ORDER }
  );

  return null;
}
