import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { create } from "zustand";

interface ViewportStore {
  lightingPreset: "soft" | "upfront" | "portrait" | "rembrandt";
  setLightingPreset: (
    preset: "soft" | "upfront" | "portrait" | "rembrandt"
  ) => void;
  environment: PresetsType;
  setEnvironment: (environment: PresetsType) => void;
}

export const useViewportStore = create<ViewportStore>((set, get) => ({
  lightingPreset: "rembrandt",
  setLightingPreset: (preset) => set({ lightingPreset: preset }),
  environment: "city",
  setEnvironment: (environment) => set({ environment }),
}));
