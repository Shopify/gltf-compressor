import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { defaultKTX2Options, KTX2OutputType } from "@/types/types";
import { compressTexture } from "@/utils/textureCompression";
import { getMaxResolutionOptions } from "@/utils/textureUtils";

import { TooltipWrapper } from "./TooltipWrapper";

export default function BulkMaterialEditingPanel() {
  const [
    textureCompressionSettingsMap,
    updateTextureCompressionSettings,
    updateModelStats,
    isBulkProcessing,
    modifyingKTX2Texture,
  ] = useModelStore(
    useShallow((state) => [
      state.textureCompressionSettingsMap,
      state.updateTextureCompressionSettings,
      state.updateModelStats,
      state.isBulkProcessing,
      state.modifyingKTX2Texture,
    ])
  );

  const [bulkFormat, setBulkFormat] = useState<string>("image/jpeg");
  const [bulkResolution, setBulkResolution] = useState<string>("0");
  const [bulkQuality, setBulkQuality] = useState<number>(0.8);
  const [maxResolutionOptions, setMaxResolutionOptions] = useState<string[]>(
    []
  );
  const [showKtx2Advanced, setShowKtx2Advanced] = useState(false);
  const [bulkKtx2OutputType, setBulkKtx2OutputType] =
    useState<KTX2OutputType>("UASTC");
  const [bulkGenerateMipmaps, setBulkGenerateMipmaps] = useState(false);
  const [bulkEnableSupercompression, setBulkEnableSupercompression] =
    useState(false);
  const [bulkEnableRDO, setBulkEnableRDO] = useState(false);
  const [bulkRdoQualityLevel, setBulkRdoQualityLevel] = useState(1.0);

  // The Shadcn slider component has a bug where it doesn't always call onValueCommit when you release the slider
  // See this issue for more details: https://github.com/radix-ui/primitives/issues/1760
  // This is a workaround to ensure that the quality is always updated correctly when the slider is released
  const lastQuality = useRef<number[]>([]);
  const lastRdoQuality = useRef<number[]>([]);
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

  const hasKtx2Textures = useMemo(() => {
    const textures = Array.from(textureCompressionSettingsMap.entries());
    return textures.some(([, settings]) => settings.mimeType === "image/ktx2");
  }, [textureCompressionSettingsMap]);

  const hasUastcTextures = useMemo(() => {
    const textures = Array.from(textureCompressionSettingsMap.entries());
    return textures.some(
      ([, settings]) =>
        settings.mimeType === "image/ktx2" &&
        settings.ktx2Options?.outputType === "UASTC"
    );
  }, [textureCompressionSettingsMap]);

  const hasUastcWithRDO = useMemo(() => {
    const textures = Array.from(textureCompressionSettingsMap.entries());
    return textures.some(
      ([, settings]) =>
        settings.mimeType === "image/ktx2" &&
        settings.ktx2Options?.outputType === "UASTC" &&
        settings.ktx2Options?.enableRDO === true
    );
  }, [textureCompressionSettingsMap]);

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

  const handleBulkKtx2OutputTypeChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.entries()).filter(
        ([, settings]) => settings.mimeType === "image/ktx2"
      );

      if (textures.length === 0) {
        toast.info("No KTX2 textures available to convert.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const [texture, settings] = textures[i];

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        const newKtx2Options = {
          ...(settings.ktx2Options ?? { ...defaultKTX2Options }),
          outputType: bulkKtx2OutputType,
        };

        updateTextureCompressionSettings(texture, {
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully converted ${textures.length} KTX2 texture${textures.length !== 1 ? "s" : ""} to ${bulkKtx2OutputType}.`
      );
    } catch (error) {
      console.error("Error during bulk KTX2 output type change:", error);
      toast.error("An error occurred during bulk KTX2 output type change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  const handleBulkGenerateMipmapsChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.entries()).filter(
        ([, settings]) => settings.mimeType === "image/ktx2"
      );

      if (textures.length === 0) {
        toast.info("No KTX2 textures available.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const [texture, settings] = textures[i];

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        const newKtx2Options = {
          ...(settings.ktx2Options ?? { ...defaultKTX2Options }),
          generateMipmaps: bulkGenerateMipmaps,
        };

        updateTextureCompressionSettings(texture, {
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully ${bulkGenerateMipmaps ? "enabled" : "disabled"} mipmap generation for ${textures.length} KTX2 texture${textures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk generate mipmaps change:", error);
      toast.error("An error occurred during bulk generate mipmaps change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  const handleBulkSupercompressionChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.entries()).filter(
        ([, settings]) =>
          settings.mimeType === "image/ktx2" &&
          settings.ktx2Options?.outputType === "UASTC"
      );

      if (textures.length === 0) {
        toast.info("No UASTC KTX2 textures available.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const [texture, settings] = textures[i];

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        const newKtx2Options = {
          ...(settings.ktx2Options ?? { ...defaultKTX2Options }),
          enableSupercompression: bulkEnableSupercompression,
        };

        updateTextureCompressionSettings(texture, {
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully ${bulkEnableSupercompression ? "enabled" : "disabled"} supercompression for ${textures.length} UASTC KTX2 texture${textures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk supercompression change:", error);
      toast.error("An error occurred during bulk supercompression change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  const handleBulkRDOChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.entries()).filter(
        ([, settings]) =>
          settings.mimeType === "image/ktx2" &&
          settings.ktx2Options?.outputType === "UASTC"
      );

      if (textures.length === 0) {
        toast.info("No UASTC KTX2 textures available.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const [texture, settings] = textures[i];

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        const newKtx2Options = {
          ...(settings.ktx2Options ?? { ...defaultKTX2Options }),
          enableRDO: bulkEnableRDO,
        };

        updateTextureCompressionSettings(texture, {
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully ${bulkEnableRDO ? "enabled" : "disabled"} RDO for ${textures.length} UASTC KTX2 texture${textures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk RDO change:", error);
      toast.error("An error occurred during bulk RDO change.");
    } finally {
      useModelStore.setState({
        isBulkProcessing: false,
        bulkProcessingProgress: null,
      });
    }
  };

  const handleBulkRdoQualityLevelChange = async () => {
    if (isBulkProcessing) return;

    try {
      useModelStore.setState({ isBulkProcessing: true });

      const textures = Array.from(textureCompressionSettingsMap.entries()).filter(
        ([, settings]) =>
          settings.mimeType === "image/ktx2" &&
          settings.ktx2Options?.outputType === "UASTC" &&
          settings.ktx2Options?.enableRDO === true
      );

      if (textures.length === 0) {
        toast.info("No UASTC KTX2 textures with RDO enabled available.");
        return;
      }

      for (let i = 0; i < textures.length; i++) {
        const [texture, settings] = textures[i];

        // Update progress
        useModelStore.setState({
          bulkProcessingProgress: {
            current: i + 1,
            total: textures.length,
          },
        });

        // Update settings
        const newKtx2Options = {
          ...(settings.ktx2Options ?? { ...defaultKTX2Options }),
          rdoQualityLevel: bulkRdoQualityLevel,
        };

        updateTextureCompressionSettings(texture, {
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Compress
        await compressTexture(texture, {
          ...settings,
          ktx2Options: newKtx2Options,
          compressionEnabled: true,
        });

        // Mark as done
        updateTextureCompressionSettings(texture, { isBeingCompressed: false });
      }

      // Update stats
      updateModelStats();
      toast.success(
        `Successfully set RDO quality level to ${bulkRdoQualityLevel.toFixed(1)} for ${textures.length} UASTC KTX2 texture${textures.length !== 1 ? "s" : ""}.`
      );
    } catch (error) {
      console.error("Error during bulk RDO quality level change:", error);
      toast.error("An error occurred during bulk RDO quality level change.");
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
            disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
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
            disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
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
            disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
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
            disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
          >
            Apply
          </Button>
        </div>
      </div>

      <Label htmlFor="bulk-quality-slider">
        Set Quality of All Textures To: {bulkQuality.toFixed(2)}
      </Label>
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
          disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
        />
        <Button
          onClick={handleBulkQualityChange}
          disabled={!hasTextures || isBulkProcessing || modifyingKTX2Texture}
        >
          Apply
        </Button>
      </div>

      {hasKtx2Textures && (
        <div className="-mt-2.5">
          <div
            className="flex items-center space-x-2 cursor-pointer select-none hover:underline"
            onClick={() => setShowKtx2Advanced(!showKtx2Advanced)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowKtx2Advanced(!showKtx2Advanced);
              }
            }}
            tabIndex={0}
            role="button"
          >
            {showKtx2Advanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="text-sm text-muted-foreground">
              Advanced KTX2 Options
            </span>
          </div>
          {showKtx2Advanced && (
            <div className="pl-1.5 pt-1">
              <span className="text-xs text-muted-foreground">
                Hover over the options to see details
              </span>
            </div>
          )}
        </div>
      )}

      {showKtx2Advanced && hasKtx2Textures && (
        <div className="pl-1.5 pb-1">
          <div className="space-y-3 pl-3 border-l-2 border-muted">
            <TooltipWrapper content="UASTC provides higher quality for detail-sensitive textures. ETC1S offers better compression ratios at lower quality.">
              <div>
                <Label htmlFor="bulk-ktx2-output-type-select">
                  Output Type:
                </Label>
                <div className="pt-1">
                  <div className="flex gap-2">
                    <Select
                      value={bulkKtx2OutputType}
                      onValueChange={(value: KTX2OutputType) =>
                        setBulkKtx2OutputType(value)
                      }
                      disabled={!hasKtx2Textures || isBulkProcessing || modifyingKTX2Texture}
                    >
                      <SelectTrigger id="bulk-ktx2-output-type-select">
                        <SelectValue placeholder="Select Output Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UASTC">UASTC</SelectItem>
                        <SelectItem value="ETC1S">ETC1S</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkKtx2OutputTypeChange}
                      disabled={!hasKtx2Textures || isBulkProcessing || modifyingKTX2Texture}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Automatically creates smaller image levels from the source, improving rendering performance at distance.">
              <div className="flex items-center gap-2">
                <Switch
                  id="bulk-ktx2-generate-mipmaps"
                  checked={bulkGenerateMipmaps}
                  onCheckedChange={setBulkGenerateMipmaps}
                  disabled={!hasKtx2Textures || isBulkProcessing || modifyingKTX2Texture}
                />
                <Label htmlFor="bulk-ktx2-generate-mipmaps">
                  Generate Mipmaps
                </Label>
                <Button
                  onClick={handleBulkGenerateMipmapsChange}
                  disabled={!hasKtx2Textures || isBulkProcessing || modifyingKTX2Texture}
                  className="ml-auto"
                >
                  Apply
                </Button>
              </div>
            </TooltipWrapper>

            {hasUastcTextures && (
              <TooltipWrapper content="Applies Zstandard compression on top of UASTC texture compression for smaller file sizes with no additional quality loss.">
                <div className="flex items-center gap-2">
                  <Switch
                    id="bulk-ktx2-supercompression"
                    checked={bulkEnableSupercompression}
                    onCheckedChange={setBulkEnableSupercompression}
                    disabled={!hasUastcTextures || isBulkProcessing || modifyingKTX2Texture}
                  />
                  <Label htmlFor="bulk-ktx2-supercompression">
                    Enable Supercompression
                  </Label>
                  <Button
                    onClick={handleBulkSupercompressionChange}
                    disabled={!hasUastcTextures || isBulkProcessing || modifyingKTX2Texture}
                    className="ml-auto"
                  >
                    Apply
                  </Button>
                </div>
              </TooltipWrapper>
            )}

            {hasUastcTextures && (
              <TooltipWrapper content="Rate Distortion Optimization reduces file size by allowing controlled quality loss. Works best with supercompression enabled.">
                <div className="flex items-center gap-2">
                  <Switch
                    id="bulk-ktx2-rdo"
                    checked={bulkEnableRDO}
                    onCheckedChange={setBulkEnableRDO}
                    disabled={!hasUastcTextures || isBulkProcessing || modifyingKTX2Texture}
                  />
                  <Label htmlFor="bulk-ktx2-rdo">
                    Enable RDO
                  </Label>
                  <Button
                    onClick={handleBulkRDOChange}
                    disabled={!hasUastcTextures || isBulkProcessing || modifyingKTX2Texture}
                    className="ml-auto"
                  >
                    Apply
                  </Button>
                </div>
              </TooltipWrapper>
            )}

            {hasUastcWithRDO && (
              <TooltipWrapper content="Controls the quality vs. file size tradeoff. Lower values (0.1-2) prioritize quality, higher values (2-10) prioritize smaller file sizes.">
                <div>
                  <Label htmlFor="bulk-ktx2-rdo-quality-slider">
                    RDO Quality Level: {bulkRdoQualityLevel.toFixed(1)}
                  </Label>
                  <div className="flex gap-2">
                    <Slider
                      id="bulk-ktx2-rdo-quality-slider"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={[bulkRdoQualityLevel]}
                      onValueChange={(value: number[]) => {
                        lastRdoQuality.current = value;
                        setBulkRdoQualityLevel(value[0]);
                      }}
                      onValueCommit={(value: number[]) => {
                        const finalValue = lastRdoQuality.current.length
                          ? lastRdoQuality.current[0]
                          : value[0];
                        lastRdoQuality.current = [];
                        setBulkRdoQualityLevel(finalValue);
                      }}
                      onLostPointerCapture={() => {
                        if (!lastRdoQuality.current.length) return;
                        const finalValue = lastRdoQuality.current[0];
                        lastRdoQuality.current = [];
                        setBulkRdoQualityLevel(finalValue);
                      }}
                      disabled={!hasUastcWithRDO || isBulkProcessing || modifyingKTX2Texture}
                    />
                    <Button
                      onClick={handleBulkRdoQualityLevelChange}
                      disabled={!hasUastcWithRDO || isBulkProcessing || modifyingKTX2Texture}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </TooltipWrapper>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
