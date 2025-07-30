import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { useShallow } from "zustand/react/shallow";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useViewportStore } from "@/stores/useViewportStore";
import { capitalize } from "@/utils/displayUtils";

import { useTheme } from "./ThemeProvider";

export default function ViewportSettingsPanel() {
  const { theme, setTheme } = useTheme();

  const [
    lightingPreset,
    environmentPreset,
    lightIntensity,
    showContactShadows,
    showGrid,
    autoRotateCamera,
  ] = useViewportStore(
    useShallow((state) => [
      state.lightingPreset,
      state.environmentPreset,
      state.lightIntensity,
      state.showContactShadows,
      state.showGrid,
      state.autoRotateCamera,
    ])
  );

  return (
    <div className="space-y-3 pt-1 pb-2">
      <Label htmlFor="theme-select">Theme</Label>
      <div className="pt-1">
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger id="theme-select">
            <SelectValue placeholder="Select Theme" />
          </SelectTrigger>
          <SelectContent>
            {["light", "dark", "system"].map((t) => (
              <SelectItem key={t} value={t}>
                {capitalize(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label htmlFor="lighting-select">Lighting</Label>
      <div className="pt-1">
        <Select
          value={lightingPreset}
          onValueChange={(value) => {
            useViewportStore.setState({
              lightingPreset: value as
                | "soft"
                | "upfront"
                | "portrait"
                | "rembrandt",
            });
          }}
        >
          <SelectTrigger id="lighting-select">
            <SelectValue placeholder="Select Lighting" />
          </SelectTrigger>
          <SelectContent>
            {["rembrandt", "portrait", "upfront", "soft"].map((preset) => (
              <SelectItem key={preset} value={preset}>
                {capitalize(preset)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label htmlFor="environment-select">Environment</Label>
      <div className="pt-1">
        <Select
          value={environmentPreset}
          onValueChange={(value) => {
            useViewportStore.setState({
              environmentPreset: value as PresetsType,
            });
          }}
        >
          <SelectTrigger id="environment-select">
            <SelectValue placeholder="Select Environment" />
          </SelectTrigger>
          <SelectContent>
            {[
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
            ].map((preset) => (
              <SelectItem key={preset} value={preset}>
                {capitalize(preset)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label htmlFor="light-intensity-slider">
        Light Intensity: {lightIntensity.toFixed(1)}
      </Label>
      <Slider
        id="light-intensity-slider"
        min={0}
        max={2}
        step={0.1}
        value={[lightIntensity]}
        onValueChange={(value) =>
          useViewportStore.setState({ lightIntensity: value[0] })
        }
        onLostPointerCapture={() => {
          useViewportStore.setState({ lightIntensity });
        }}
        className="pt-4 pb-1"
      />

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="show-contact-shadows-switch"
          checked={showContactShadows}
          onCheckedChange={(value) =>
            useViewportStore.setState({ showContactShadows: value })
          }
        />
        <Label htmlFor="show-contact-shadows-switch">
          Show Contact Shadows
        </Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="show-grid-switch"
          checked={showGrid}
          onCheckedChange={(value) =>
            useViewportStore.setState({ showGrid: value })
          }
        />
        <Label htmlFor="show-grid-switch">Show Grid</Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="auto-rotate-camera-switch"
          checked={autoRotateCamera}
          onCheckedChange={(value) =>
            useViewportStore.setState({ autoRotateCamera: value })
          }
        />
        <Label htmlFor="auto-rotate-camera-switch">Auto-Rotate Camera</Label>
      </div>
    </div>
  );
}
