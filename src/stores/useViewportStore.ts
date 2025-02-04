import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { create } from "zustand";

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
}

export const useViewportStore = create<ViewportStore>((set, get) => ({
  lightingPreset: "rembrandt",
  setLightingPreset: (preset) => set({ lightingPreset: preset }),
  environmentPreset: "city",
  setEnvironmentPreset: (environmentPreset) => set({ environmentPreset }),
  lightIntensity: 1,
  setLightIntensity: (lightIntensity) => set({ lightIntensity }),
  contactShadows: true,
  setContactShadows: (contactShadows) => set({ contactShadows }),
}));
