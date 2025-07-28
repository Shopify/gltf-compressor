import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ViewportStore {
  lightingPreset: "soft" | "upfront" | "portrait" | "rembrandt";
  environmentPreset: PresetsType;
  lightIntensity: number;
  showContactShadows: boolean;
  showGrid: boolean;
  autoRotateCamera: boolean;
  modelDimensions: [number, number, number] | null;
  modelViewPanelSize: number;
  showModifiedDocument: boolean;
  showConfetti: boolean;
}

export const useViewportStore = create<ViewportStore>()(
  subscribeWithSelector((_) => {
    return {
      lightingPreset: "rembrandt",
      environmentPreset: "city",
      lightIntensity: 1,
      showContactShadows: true,
      showGrid: true,
      autoRotateCamera: false,
      modelDimensions: null,
      modelViewPanelSize: 66,
      showModifiedDocument: true,
      showConfetti: false,
    };
  })
);
