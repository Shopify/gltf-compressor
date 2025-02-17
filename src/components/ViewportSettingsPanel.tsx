"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

export default function ViewportSettingsPanel() {
  const {
    setLightingPreset,
    setEnvironmentPreset,
    setLightIntensity,
    setContactShadows,
    setGrid,
    setAutoRotate,
  } = useViewportStore();

  const [lightingPreset, setLocalLightingPreset] = useState("rembrandt");
  const [environmentPreset, setLocalEnvironmentPreset] = useState("city");
  const [lightIntensity, setLocalLightIntensity] = useState(1);
  const [contactShadows, setLocalContactShadows] = useState(true);
  const [grid, setLocalGrid] = useState(true);
  const [autoRotate, setLocalAutoRotate] = useState(false);

  useEffect(() => {
    setLightingPreset(lightingPreset);
  }, [lightingPreset, setLightingPreset]);

  useEffect(() => {
    setEnvironmentPreset(environmentPreset);
  }, [environmentPreset, setEnvironmentPreset]);

  useEffect(() => {
    setLightIntensity(lightIntensity);
  }, [lightIntensity, setLightIntensity]);

  useEffect(() => {
    setContactShadows(contactShadows);
  }, [contactShadows, setContactShadows]);

  useEffect(() => {
    setGrid(grid);
  }, [grid, setGrid]);

  useEffect(() => {
    setAutoRotate(autoRotate);
  }, [autoRotate, setAutoRotate]);

  return (
    <Draggable handle=".drag-handle">
      <Card className="w-80 absolute top-4 left-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Viewport Settings
          </CardTitle>
          <GripVertical className="h-4 w-4 opacity-50 cursor-move drag-handle" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="lighting-preset">Lighting Preset</Label>
            <Select
              value={lightingPreset}
              onValueChange={setLocalLightingPreset}
            >
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
            <Select
              value={environmentPreset}
              onValueChange={setLocalEnvironmentPreset}
            >
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

          <div className="space-y-1">
            <Label htmlFor="light-intensity">
              Light Intensity: {lightIntensity.toFixed(1)}
            </Label>
            <Slider
              id="light-intensity"
              min={0}
              max={2}
              step={0.1}
              value={[lightIntensity]}
              onValueChange={(value) => setLocalLightIntensity(value[0])}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="contact-shadows"
              checked={contactShadows}
              onCheckedChange={setLocalContactShadows}
            />
            <Label htmlFor="contact-shadows">Contact Shadows</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="grid" checked={grid} onCheckedChange={setLocalGrid} />
            <Label htmlFor="grid">Grid</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-rotate"
              checked={autoRotate}
              onCheckedChange={setLocalAutoRotate}
            />
            <Label htmlFor="auto-rotate">Auto-Rotate</Label>
          </div>
        </CardContent>
      </Card>
    </Draggable>
  );
}
