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
import { useTheme } from "./ThemeProvider";

export default function ViewportSettingsPanel() {
  const { theme, setTheme } = useTheme();

  const {
    lightingPreset,
    environmentPreset,
    lightIntensity,
    contactShadows,
    grid,
    autoRotate,
    setLightingPreset,
    setEnvironmentPreset,
    setLightIntensity,
    setContactShadows,
    setGrid,
    setAutoRotate,
  } = useViewportStore();

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="theme">Theme</Label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger id="theme">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {["light", "dark", "system"].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="lighting-preset">Lighting Preset</Label>
        <Select value={lightingPreset} onValueChange={setLightingPreset}>
          <SelectTrigger id="lighting-preset">
            <SelectValue placeholder="Select lighting preset" />
          </SelectTrigger>
          <SelectContent>
            {["rembrandt", "portrait", "upfront", "soft"].map((preset) => (
              <SelectItem key={preset} value={preset}>
                {preset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="environment-preset">Environment Preset</Label>
        <Select value={environmentPreset} onValueChange={setEnvironmentPreset}>
          <SelectTrigger id="environment-preset">
            <SelectValue placeholder="Select environment preset" />
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
                {preset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="light-intensity">
          Light Intensity: {lightIntensity.toFixed(1)}
        </Label>
        <Slider
          id="light-intensity"
          min={0}
          max={2}
          step={0.1}
          value={[lightIntensity]}
          onValueChange={(value) => setLightIntensity(value[0])}
        />
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="contact-shadows"
          checked={contactShadows}
          onCheckedChange={setContactShadows}
        />
        <Label htmlFor="contact-shadows">Contact Shadows</Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch id="grid" checked={grid} onCheckedChange={setGrid} />
        <Label htmlFor="grid">Grid</Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="auto-rotate"
          checked={autoRotate}
          onCheckedChange={setAutoRotate}
        />
        <Label htmlFor="auto-rotate">Auto-Rotate</Label>
      </div>
    </div>
  );
}
