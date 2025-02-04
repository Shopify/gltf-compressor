import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ViewportStore {
  lightingPreset: "soft" | "upfront" | "portrait" | "rembrandt";
  setLightingPreset: (
    preset: "soft" | "upfront" | "portrait" | "rembrandt"
  ) => void;
  environmentPreset: PresetsType;
  setEnvironmentPreset: (environmentPreset: PresetsType) => void;
  lightIntensity: number;
  setLightIntensity: (lightIntensity: number) => void;
  contactShadows: boolean;
  setContactShadows: (contactShadows: boolean) => void;
  grid: boolean;
  setGrid: (grid: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (autoRotate: boolean) => void;
  modelDimensions: [number, number, number] | null;
  setModelDimensions: (dimensions: [number, number, number]) => void;
}

export const useViewportStore = create<ViewportStore>()(
  subscribeWithSelector((set) => {
    return {
      lightingPreset: "rembrandt",
      setLightingPreset: (preset) => set({ lightingPreset: preset }),
      environmentPreset: "city",
      setEnvironmentPreset: (environmentPreset) => set({ environmentPreset }),
      lightIntensity: 1,
      setLightIntensity: (lightIntensity) => set({ lightIntensity }),
      contactShadows: true,
      setContactShadows: (contactShadows) => set({ contactShadows }),
      grid: true,
      setGrid: (grid) => set({ grid }),
      autoRotate: false,
      setAutoRotate: (autoRotate) => set({ autoRotate }),
      modelDimensions: null,
      setModelDimensions: (dimensions) => set({ modelDimensions: dimensions }),
    };
  })
);
