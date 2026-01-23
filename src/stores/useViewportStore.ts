import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { Mesh } from "three";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ViewportStore {
  loadingFiles: boolean;
  revealScene: boolean;
  lightingPreset: "soft" | "upfront" | "portrait" | "rembrandt";
  environmentPreset: PresetsType;
  lightIntensity: number;
  showContactShadows: boolean;
  showGrid: boolean;
  autoRotateCamera: boolean;
  modelDimensions: [number, number, number] | null;
  modelViewPanelSize: number;
  showModifiedDocument: boolean;
  confettiCounter: number;
  triggerConfetti: () => void;
  isPanelResizing: boolean;
  shadowPlane: Mesh | null;
}

export const useViewportStore = create<ViewportStore>()(
  subscribeWithSelector((set) => {
    return {
      loadingFiles: false,
      revealScene: false,
      lightingPreset: "rembrandt",
      environmentPreset: "city",
      lightIntensity: 1,
      showContactShadows: true,
      showGrid: true,
      autoRotateCamera: false,
      modelDimensions: null,
      modelViewPanelSize: 66,
      showModifiedDocument: true,
      confettiCounter: 0,
      triggerConfetti: () =>
        set((state) => ({ confettiCounter: state.confettiCounter + 1 })),
      isPanelResizing: false,
      shadowPlane: null,
    };
  })
);
