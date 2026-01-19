import { useEffect, useRef, useState } from "react";
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
import { compressTexture } from "@/utils/textureCompression";
import { getMaxResolutionOptions } from "@/utils/textureUtils";

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

  const [bulkFormat, setBulkFormat] = useState<string>("image/jpeg");
  const [bulkResolution, setBulkResolution] = useState<string>("0");
  const [bulkQuality, setBulkQuality] = useState<number>(0.8);
  const [maxResolutionOptions, setMaxResolutionOptions] = useState<string[]>(
    []
  );

  // The Shadcn slider component has a bug where it doesn't always call onValueCommit when you release the slider
  // See this issue for more details: https://github.com/radix-ui/primitives/issues/1760
  // This is a workaround to ensure that the quality is always updated correctly when the slider is released
  const lastQuality = useRef<number[]>([]);
  const hasInitializedResolution = useRef(false);

  // Compute max resolution options based on the largest texture in the model
  // and set the default bulk resolution to the largest option
  useEffect(() => {
    if (hasInitializedResolution.current || textureCompressionSettingsMap.size === 0) {
      return;
    }

    // Find the maximum resolution among all textures
    let globalMaxResolution = 0;
    const textures = Array.from(textureCompressionSettingsMap.keys());

    for (const texture of textures) {
      const resolution = texture.getSize() ?? [0, 0];
      const maxRes = Math.max(resolution[0], resolution[1]);
      if (maxRes > globalMaxResolution) {
        globalMaxResolution = maxRes;
      }
    }

    // Set the resolution options based on the global max
    const options = getMaxResolutionOptions(globalMaxResolution);
    setMaxResolutionOptions(options);

    // Set bulk resolution to the largest option
    if (options.length > 0) {
      setBulkResolution(options[0]);
    }

    hasInitializedResolution.current = true;
  }, [textureCompressionSettingsMap]);

  // Bulk format conversion handler
  const handleBulkFormatChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.keys());

      if (textures.length === 0) {
        toast.info("No textures available to convert.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
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
        `Successfully converted ${textures.length} texture${textures.length !== 1 ? "s" : ""} to ${bulkFormat === "image/jpeg" ? "JPEG" : bulkFormat === "image/png" ? "PNG" : bulkFormat === "image/webp" ? "WebP" : "KTX2"}.`
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

      if (textures.length === 0) {
        toast.info("No textures available to resize.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Get the texture's original maximum resolution
        const resolution = texture.getSize() ?? [0, 0];
        const textureMaxResolution = Math.max(resolution[0], resolution[1]);

        // Use the minimum of the target resolution and the texture's original resolution
        // This ensures textures can't be upscaled beyond their original size
        const effectiveResolution = Math.min(
          targetResolution,
          textureMaxResolution
        );

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        updateTextureCompressionSettings(texture, {
          maxResolution: effectiveResolution,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          maxResolution: effectiveResolution,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully set max resolution of all textures to ${targetResolution} pixels.`
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

      if (textures.length === 0) {
        toast.info("No textures available to change quality.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];
        const settings = textureCompressionSettingsMap.get(texture)!;

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
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
        `Successfully set quality to ${Number(bulkQuality.toFixed(2))} for ${textures.length} texture${textures.length !== 1 ? "s" : ""}.`
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
              <SelectItem value="image/ktx2">KTX2</SelectItem>
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

      <Label htmlFor="bulk-resolution-select">Set Max Resolution Of All Textures To:</Label>
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
              {maxResolutionOptions.length > 0 ? (
                maxResolutionOptions.map((option) => (
                  <SelectItem
                    key={`resolution-${option}`}
                    value={option.toString()}
                  >
                    {option}
                  </SelectItem>
                ))
              ) : (
                <SelectItem key="resolution-0" value="0">
                  0
                </SelectItem>
              )}
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
      <div className="pt-1">
        <div className="flex gap-2">
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
          />
          <Button
            onClick={handleBulkQualityChange}
            disabled={!hasTextures || isBulkProcessing}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
