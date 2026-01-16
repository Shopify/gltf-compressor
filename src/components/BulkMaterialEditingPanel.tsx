import { Texture } from "@gltf-transform/core";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useModelStore } from "@/stores/useModelStore";
import { TextureCompressionSettings } from "@/types/types";
import { compressTexture } from "@/utils/textureCompression";

export default function BulkMaterialEditingPanel() {
  const [
    textureCompressionSettingsMap,
    updateTextureCompressionSettings,
    updateModelStats,
    isBulkProcessing,
  ] = useModelStore(
    useShallow((state) => [
      state.textureCompressionSettingsMap,
      state.updateTextureCompressionSettings,
      state.updateModelStats,
      state.isBulkProcessing,
    ])
  );

  const [bulkFormat, setBulkFormat] = useState<string>("image/webp");
  const [bulkResolution, setBulkResolution] = useState<string>("1024");
  const [bulkQuality, setBulkQuality] = useState<number>(0.8);

  // The Shadcn slider component has a bug where it doesn't always call onValueCommit when you release the slider
  // See this issue for more details: https://github.com/radix-ui/primitives/issues/1760
  // This is a workaround to ensure that the quality is always updated correctly when the slider is released
  const lastQuality = useRef<number[]>([]);

  // Filter functions to determine which textures can be modified
  const canChangeFormat = (
    _texture: Texture,
    settings: TextureCompressionSettings
  ): boolean => {
    return settings.mimeType !== "image/ktx2";
  };

  const canChangeResolution = (
    texture: Texture,
    settings: TextureCompressionSettings,
    targetResolution: number
  ): boolean => {
    if (settings.mimeType === "image/ktx2") return false;
    const resolution = texture.getSize() ?? [0, 0];
    const currentMaxResolution = Math.max(resolution[0], resolution[1]);
    return currentMaxResolution >= targetResolution;
  };

  const canChangeQuality = (
    _texture: Texture,
    settings: TextureCompressionSettings
  ): boolean => {
    return settings.mimeType !== "image/ktx2";
  };

  // Bulk format conversion handler
  const handleBulkFormatChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.keys());
      const qualifyingTextures = textures.filter((texture) => {
        const settings = textureCompressionSettingsMap.get(texture);
        return settings && canChangeFormat(texture, settings);
      });

      if (qualifyingTextures.length === 0) {
        toast.info("No textures can be converted to this format.");
        return;
      }

      for (let i = 0; i < qualifyingTextures.length; i++) {
        const texture = qualifyingTextures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: qualifyingTextures.length,
          },
        });

        // Update settings
        updateTextureCompressionSettings(texture, {
          mimeType: bulkFormat,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          mimeType: bulkFormat,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully converted ${qualifyingTextures.length} texture${qualifyingTextures.length !== 1 ? "s" : ""} to ${bulkFormat === "image/jpeg" ? "JPEG" : bulkFormat === "image/png" ? "PNG" : "WebP"}.`
      );
    } catch (error) {
      console.error("Error during bulk format conversion:", error);
      toast.error("An error occurred during bulk format conversion.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  // Bulk resolution change handler
  const handleBulkResolutionChange = async () => {
    if (isBulkProcessing) return;

    const targetResolution = parseInt(bulkResolution, 10);

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.keys());
      const qualifyingTextures = textures.filter((texture) => {
        const settings = textureCompressionSettingsMap.get(texture);
        return (
          settings && canChangeResolution(texture, settings, targetResolution)
        );
      });

      if (qualifyingTextures.length === 0) {
        toast.info(
          "No textures can be changed to this resolution (textures must be at least this size)."
        );
        return;
      }

      for (let i = 0; i < qualifyingTextures.length; i++) {
        const texture = qualifyingTextures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: qualifyingTextures.length,
          },
        });

        // Update settings
        updateTextureCompressionSettings(texture, {
          maxResolution: targetResolution,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          maxResolution: targetResolution,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully set resolution to ${targetResolution}px for ${qualifyingTextures.length} texture${qualifyingTextures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk resolution change:", error);
      toast.error("An error occurred during bulk resolution change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  // Bulk quality change handler
  const handleBulkQualityChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.keys());
      const qualifyingTextures = textures.filter((texture) => {
        const settings = textureCompressionSettingsMap.get(texture);
        return settings && canChangeQuality(texture, settings);
      });

      if (qualifyingTextures.length === 0) {
        toast.info("No textures can have their quality changed.");
        return;
      }

      for (let i = 0; i < qualifyingTextures.length; i++) {
        const texture = qualifyingTextures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: qualifyingTextures.length,
          },
        });

        // Update settings
        updateTextureCompressionSettings(texture, {
          quality: bulkQuality,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          quality: bulkQuality,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully set quality to ${bulkQuality.toFixed(2)} for ${qualifyingTextures.length} texture${qualifyingTextures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk quality change:", error);
      toast.error("An error occurred during bulk quality change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  const hasTextures = textureCompressionSettingsMap.size > 0;

  return (
    <div className="space-y-3 pt-1 pb-2">
      <Label htmlFor="bulk-format-select">Convert All Textures To:</Label>
      <div className="pt-1">
        <div className="flex gap-2">
          <Select
            value={bulkFormat}
            onValueChange={setBulkFormat}
            disabled={!hasTextures || isBulkProcessing}
          >
            <SelectTrigger id="bulk-format-select">
              <SelectValue placeholder="Select Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image/jpeg">JPEG</SelectItem>
              <SelectItem value="image/png">PNG</SelectItem>
              <SelectItem value="image/webp">WebP</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleBulkFormatChange}
            disabled={!hasTextures || isBulkProcessing}
          >
            Apply
          </Button>
        </div>
      </div>

      <Label htmlFor="bulk-resolution-select">Set All Resolutions To:</Label>
      <div className="pt-1">
        <div className="flex gap-2">
          <Select
            value={bulkResolution}
            onValueChange={setBulkResolution}
            disabled={!hasTextures || isBulkProcessing}
          >
            <SelectTrigger id="bulk-resolution-select">
              <SelectValue placeholder="Select Resolution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8192">8192</SelectItem>
              <SelectItem value="4096">4096</SelectItem>
              <SelectItem value="2048">2048</SelectItem>
              <SelectItem value="1024">1024</SelectItem>
              <SelectItem value="512">512</SelectItem>
              <SelectItem value="256">256</SelectItem>
              <SelectItem value="128">128</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleBulkResolutionChange}
            disabled={!hasTextures || isBulkProcessing}
          >
            Apply
          </Button>
        </div>
      </div>

      <Label htmlFor="bulk-quality-slider">
        Set Quality of All Textures To: {bulkQuality.toFixed(2)}
      </Label>
      <Slider
        id="bulk-quality-slider"
        min={0}
        max={1}
        step={0.01}
        value={[bulkQuality]}
        onValueChange={(value: number[]) => {
          lastQuality.current = value;
          setBulkQuality(value[0]);
        }}
        onValueCommit={(value: number[]) => {
          const finalValue = lastQuality.current.length
            ? lastQuality.current[0]
            : value[0];
          lastQuality.current = [];
          setBulkQuality(finalValue);
        }}
        onLostPointerCapture={() => {
          if (!lastQuality.current.length) return;
          const finalValue = lastQuality.current[0];
          lastQuality.current = [];
          setBulkQuality(finalValue);
        }}
        disabled={!hasTextures || isBulkProcessing}
        className="pt-4 pb-1"
      />
      <Button
        onClick={handleBulkQualityChange}
        disabled={!hasTextures || isBulkProcessing}
        className="w-full"
      >
        Apply Quality
      </Button>
    </div>
  );
}
