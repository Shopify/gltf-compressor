import { Material } from "@gltf-transform/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { defaultKTX2Options, KTX2Options, KTX2OutputType } from "@/types/types";
import { formatSize } from "@/utils/displayUtils";
import { compressTexture } from "@/utils/textureCompression";
import { restoreOriginalTexture } from "@/utils/textureLoading";
import {
  getMaxResolutionOptions,
  getTextureBySlot,
  getTexturesFromMaterial,
  getTextureSizeInKB,
  getTextureSlotsFromMaterial,
} from "@/utils/textureUtils";

import { TooltipWrapper } from "./TooltipWrapper";

export default function MaterialEditingPanel() {
  const [
    originalDocument,
    modifiedDocument,
    selectedMaterial,
    selectedTextureSlot,
    selectedTexture,
    textureCompressionSettingsMap,
    updateTextureCompressionSettings,
    updateModelStats,
    isBulkProcessing,
    modifyingKTX2Texture,
  ] = useModelStore(
    useShallow((state) => [
      state.originalDocument,
      state.modifiedDocument,
      state.selectedMaterial,
      state.selectedTextureSlot,
      state.selectedTexture,
      state.textureCompressionSettingsMap,
      state.updateTextureCompressionSettings,
      state.updateModelStats,
      state.isBulkProcessing,
      state.modifyingKTX2Texture,
    ])
  );

  const [materials, setMaterials] = useState<
    { id: string; name: string; material: Material }[]
  >([]);
  const [textureSlots, setTextureSlots] = useState<string[]>([]);
  const [doubleSided, setDoubleSided] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [maxResolution, setMaxResolution] = useState(0);
  const [maxResolutionOptions, setMaxResolutionOptions] = useState<string[]>(
    []
  );
  const [quality, setQuality] = useState(0.8);
  const [originalImageSize, setOriginalImageSize] = useState(0);
  const [compressedImageSize, setCompressedImageSize] = useState(0);
  const [percentChangeInImageSize, setPercentChangeInImageSize] = useState(0);
  const [ktx2Options, setKtx2Options] = useState<KTX2Options>({
    ...defaultKTX2Options,
  });
  const [showKtx2Advanced, setShowKtx2Advanced] = useState(false);

  // The Shadcn slider component has a bug where it doesn't always call onValueCommit when you release the slider
  // See this issue for more details: https://github.com/radix-ui/primitives/issues/1760
  // This is a workaround to ensure that the quality is always updated correctly when the slider is released
  const lastQuality = useRef<number[]>([]);
  const lastRdoQuality = useRef<number[]>([]);

  // Initialize panel
  useEffect(() => {
    if (!originalDocument) {
      return;
    }

    const materialList = originalDocument.getRoot().listMaterials();
    const materialsWithIds = materialList.map((material, index) => ({
      id: `material-${index}`,
      name: material.getName() || `Material ${index}`,
      material,
    }));

    setMaterials(materialsWithIds);
    const firstMaterial = materialList[0];

    if (!firstMaterial) {
      return;
    }

    const slots = getTextureSlotsFromMaterial(firstMaterial);
    const textures = getTexturesFromMaterial(firstMaterial);
    const { slot: firstSlot, texture: firstTexture } = textures[0] ?? {};
    const resolution = firstTexture?.getSize() ?? [0, 0];
    const maxRes = Math.max(resolution[0], resolution[1]);
    const originalSize = getTextureSizeInKB(firstTexture);

    useModelStore.setState({
      selectedMaterial: firstMaterial,
      selectedTextureSlot: firstSlot ?? "",
      selectedTexture: firstTexture ?? null,
    });

    setTextureSlots(slots ?? []);
    setDoubleSided(firstMaterial.getDoubleSided());
    setMaxResolution(maxRes);
    setMaxResolutionOptions(getMaxResolutionOptions(maxRes));
    setOriginalImageSize(originalSize);
  }, [originalDocument]);

  // Update texture slots and the selected slot/texture when material changes
  useEffect(() => {
    if (!selectedMaterial) {
      return;
    }

    const slots = getTextureSlotsFromMaterial(selectedMaterial);
    const textures = getTexturesFromMaterial(selectedMaterial);
    const { slot: firstSlot, texture: firstTexture } = textures[0] ?? {};

    useModelStore.setState({
      selectedTextureSlot: firstSlot ?? "",
      selectedTexture: firstTexture ?? null,
    });

    setTextureSlots(slots ?? []);
    setDoubleSided(selectedMaterial.getDoubleSided());
  }, [selectedMaterial]);

  // Update compression settings when texture changes
  useEffect(() => {
    if (selectedTexture) {
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      const isCompressed =
        textureCompressionSettings?.compressionEnabled ?? false;
      const imgMimeType = textureCompressionSettings?.mimeType ?? "image/jpeg";
      const maxRes = textureCompressionSettings?.maxResolution ?? 0;
      const resolution = selectedTexture.getSize() ?? [0, 0];
      const originalMaxResolution = Math.max(resolution[0], resolution[1]);
      const textureQuality = textureCompressionSettings?.quality ?? 0.8;
      const originalSize = getTextureSizeInKB(selectedTexture);
      const compressedSize = getTextureSizeInKB(
        textureCompressionSettings?.compressedTexture
      );
      const percentChangeInImageSize =
        originalSize > 0
          ? ((originalSize - compressedSize) / originalSize) * 100
          : 0;
      setCompressionEnabled(isCompressed);
      setMimeType(imgMimeType);
      setMaxResolution(maxRes);
      setMaxResolutionOptions(getMaxResolutionOptions(originalMaxResolution));
      setQuality(textureQuality);
      setOriginalImageSize(originalSize);
      setCompressedImageSize(compressedSize);
      setPercentChangeInImageSize(percentChangeInImageSize);
      setKtx2Options(
        textureCompressionSettings?.ktx2Options ?? { ...defaultKTX2Options }
      );
    } else {
      // Reset to default values when no texture is selected
      setCompressionEnabled(false);
      setMimeType("image/jpeg");
      setMaxResolution(0);
      setMaxResolutionOptions(["0"]);
      setQuality(0.8);
      setOriginalImageSize(0);
      setCompressedImageSize(0);
      setPercentChangeInImageSize(0);
      setKtx2Options({ ...defaultKTX2Options });
    }
  }, [selectedTexture, textureCompressionSettingsMap]);

  const handleMaterialChange = (value: string) => {
    if (!originalDocument) {
      return;
    }

    const materialWithId = materials.find((m) => m.id === value);
    if (!materialWithId) {
      return;
    }

    useModelStore.setState({
      selectedMaterial: materialWithId.material,
    });
  };

  const handleTextureChange = (value: string) => {
    if (!selectedMaterial) {
      return;
    }

    const texture = getTextureBySlot(selectedMaterial, value);
    useModelStore.setState({
      selectedTextureSlot: value,
      selectedTexture: texture,
    });
  };

  const handleDoubleSidedChange = async (value: boolean) => {
    if (!selectedMaterial || !originalDocument || !modifiedDocument) {
      return;
    }

    setDoubleSided(value);

    // Find the index of the selected material in the original document
    const originalMaterials = originalDocument.getRoot().listMaterials();
    const materialIndex = originalMaterials.indexOf(selectedMaterial);

    if (materialIndex !== -1) {
      // Get the corresponding material from the modified document
      const modifiedMaterials = modifiedDocument.getRoot().listMaterials();
      const modifiedMaterial = modifiedMaterials[materialIndex];

      if (modifiedMaterial) {
        // Update the double-sided property on the modified material
        modifiedMaterial.setDoubleSided(value);
      }
    }
  };

  const handleCompressionChange = async (value: boolean) => {
    if (!selectedTexture) {
      return;
    }

    setCompressionEnabled(value);

    if (value) {
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      if (textureCompressionSettings) {
        // Check if we're working with a KTX2 texture
        const isKTX2 = mimeType === "image/ktx2";

        // Update compression setting and flag texture as compressing
        updateTextureCompressionSettings(selectedTexture, {
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        // Set global flag if working with KTX2
        if (isKTX2) {
          useModelStore.setState({ modifyingKTX2Texture: true });
        }

        try {
          const result = await compressTexture(
            selectedTexture,
            textureCompressionSettings,
            { isInitialCompression: true }
          );
          if (result.warning) {
            toast.warning(result.warning);
          }
        } finally {
          // Flag texture as done compressing
          updateTextureCompressionSettings(selectedTexture, {
            isBeingCompressed: false,
          });

          // Clear global flag if it was set
          if (isKTX2) {
            useModelStore.setState({ modifyingKTX2Texture: false });
          }

          // Update user interface
          const compressedSize = getTextureSizeInKB(
            textureCompressionSettings.compressedTexture
          );
          const percentChangeInImageSize =
            originalImageSize > 0
              ? ((originalImageSize - compressedSize) / originalImageSize) * 100
              : 0;
          setCompressedImageSize(compressedSize);
          setPercentChangeInImageSize(percentChangeInImageSize);
          updateModelStats();
        }
      }
    } else {
      // Update compression setting
      updateTextureCompressionSettings(selectedTexture, {
        compressionEnabled: false,
      });

      // Restore original texture because compression is being disabled
      const compressedTexture =
        textureCompressionSettingsMap.get(selectedTexture)?.compressedTexture;
      if (compressedTexture) {
        restoreOriginalTexture(compressedTexture, selectedTexture)
          .then(() => {
            // Update user interface
            updateModelStats();
          })
          .catch((error) => {
            console.error("Error restoring original texture: ", error);
          });
      }
    }
  };

  const handleCompressionSettingChange = async <T,>(
    value: T,
    stateSetter: (value: T) => void,
    settingKey: string
  ) => {
    if (!selectedTexture) {
      return;
    }

    stateSetter(value);

    if (compressionEnabled) {
      // Re-compress with new setting
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      if (textureCompressionSettings) {
        // Check if we're working with a KTX2 texture (either current or changing to)
        const isKTX2 =
          mimeType === "image/ktx2" ||
          (settingKey === "mimeType" && value === "image/ktx2");

        // Update compression setting and flag texture as compressing
        updateTextureCompressionSettings(selectedTexture, {
          [settingKey]: value,
          isBeingCompressed: true,
        });

        // Set global flag if working with KTX2
        if (isKTX2) {
          useModelStore.setState({ modifyingKTX2Texture: true });
        }

        try {
          const result = await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            [settingKey]: value,
          });
          if (result.warning) {
            toast.warning(result.warning);
          }
        } finally {
          // Flag texture as done compressing
          updateTextureCompressionSettings(selectedTexture, {
            isBeingCompressed: false,
          });

          // Clear global flag if it was set
          if (isKTX2) {
            useModelStore.setState({ modifyingKTX2Texture: false });
          }

          // Update user interface
          const compressedSize = getTextureSizeInKB(
            textureCompressionSettings.compressedTexture
          );
          const percentChangeInImageSize =
            originalImageSize > 0
              ? ((originalImageSize - compressedSize) / originalImageSize) * 100
              : 0;
          setCompressedImageSize(compressedSize);
          setPercentChangeInImageSize(percentChangeInImageSize);
          updateModelStats();
        }
      }
    } else {
      // Update compression setting
      updateTextureCompressionSettings(selectedTexture, {
        [settingKey]: value,
      });
    }
  };

  const handleMimeTypeChange = async (value: string) => {
    await handleCompressionSettingChange(value, setMimeType, "mimeType");
  };

  const handleMaxResolutionChange = async (value: string) => {
    await handleCompressionSettingChange(
      parseInt(value, 10),
      setMaxResolution,
      "maxResolution"
    );
  };

  const handleQualityChange = async (value: number) => {
    await handleCompressionSettingChange(value, setQuality, "quality");
  };

  const handleKtx2OptionChange = async <K extends keyof KTX2Options>(
    key: K,
    value: KTX2Options[K]
  ) => {
    const newOptions = { ...ktx2Options, [key]: value };
    await handleCompressionSettingChange(
      newOptions,
      setKtx2Options,
      "ktx2Options"
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyC" && !event.repeat) {
        event.preventDefault();
        useViewportStore.setState({
          showModifiedDocument: false,
        });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyC") {
        event.preventDefault();
        useViewportStore.setState({
          showModifiedDocument: true,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="space-y-3 pt-1 pb-2">
      <TooltipWrapper content="Hold X to highlight meshes that use the selected material">
        <Label htmlFor="material-select">Material</Label>
      </TooltipWrapper>
      <div className="pt-1">
        <Select
          value={
            materials.find((m) => m.material === selectedMaterial)?.id ?? ""
          }
          onValueChange={handleMaterialChange}
          disabled={materials.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        >
          <SelectTrigger id="material-select">
            <SelectValue
              placeholder={
                materials.length === 0
                  ? "No Materials Available"
                  : "Select Material"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {materials.map((materialWithId) => (
              <SelectItem key={materialWithId.id} value={materialWithId.id}>
                {materialWithId.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label
        htmlFor="texture-select"
        className={textureSlots.length === 0 ? "text-muted-foreground" : ""}
      >
        Texture
      </Label>
      <div className="pt-1">
        <Select
          value={selectedTextureSlot}
          onValueChange={handleTextureChange}
          disabled={textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        >
          <SelectTrigger id="texture-select">
            <SelectValue
              placeholder={
                textureSlots.length === 0
                  ? "No Textures Available"
                  : "Select Texture"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {textureSlots.map((slot) => (
              <SelectItem key={`texture-${slot}`} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="double-sided-material-switch"
          checked={doubleSided}
          onCheckedChange={handleDoubleSidedChange}
          disabled={materials.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        />
        <Label
          htmlFor="double-sided-material-switch"
          className={materials.length === 0 ? "text-muted-foreground" : ""}
        >
          Double-Sided Material
        </Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="compress-texture-switch"
          checked={compressionEnabled}
          onCheckedChange={handleCompressionChange}
          disabled={textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        />
        <Label
          htmlFor="compress-texture-switch"
          className={textureSlots.length === 0 ? "text-muted-foreground" : ""}
        >
          Compress Texture
        </Label>
      </div>

      <Label
        htmlFor="image-format-select"
        className={
          !compressionEnabled || textureSlots.length === 0
            ? "text-muted-foreground"
            : ""
        }
      >
        Image Format
      </Label>
      <div className="pt-1">
        <Select
          value={mimeType}
          onValueChange={handleMimeTypeChange}
          disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        >
          <SelectTrigger id="image-format-select">
            <SelectValue placeholder="Select Image Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="image-format-jpeg" value="image/jpeg">
              JPEG
            </SelectItem>
            <SelectItem key="image-format-png" value="image/png">
              PNG
            </SelectItem>
            <SelectItem key="image-format-webp" value="image/webp">
              WebP
            </SelectItem>
            <SelectItem key="image-format-ktx2" value="image/ktx2">
              KTX2
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Label
        htmlFor="resolution-select"
        className={
          !compressionEnabled || textureSlots.length === 0
            ? "text-muted-foreground"
            : ""
        }
      >
        Resolution
      </Label>
      <div className="pt-1">
        <Select
          value={maxResolution.toString()}
          onValueChange={handleMaxResolutionChange}
          disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        >
          <SelectTrigger id="resolution-select">
            <SelectValue placeholder="Select Resolution" />
          </SelectTrigger>
          <SelectContent>
            {maxResolutionOptions.map((option) => (
              <SelectItem
                key={`resolution-${option}`}
                value={option.toString()}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label
        htmlFor="quality-slider"
        className={
          !compressionEnabled || textureSlots.length === 0
            ? "text-muted-foreground"
            : ""
        }
      >
        Quality: {quality.toFixed(2)}
      </Label>
      <Slider
        id="quality-slider"
        min={0}
        max={1}
        step={0.01}
        value={[quality]}
        onValueChange={(value: number[]) => {
          lastQuality.current = value;
          setQuality(value[0]);
        }}
        onValueCommit={(value: number[]) => {
          const finalValue = lastQuality.current.length
            ? lastQuality.current[0]
            : value[0];
          lastQuality.current = [];
          handleQualityChange(finalValue);
        }}
        onLostPointerCapture={() => {
          if (!lastQuality.current.length) return;
          const finalValue = lastQuality.current[0];
          lastQuality.current = [];
          handleQualityChange(finalValue);
        }}
        disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
        className="pt-4 pb-1"
      />

      {mimeType === "image/ktx2" && (
        <div>
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

      {showKtx2Advanced && mimeType === "image/ktx2" && (
        <div className="pl-1.5 pb-1">
          <div className="space-y-3 pl-3 border-l-2 border-muted">
            <TooltipWrapper content="UASTC provides higher quality for detail-sensitive textures. ETC1S offers better compression ratios at lower quality.">
              <div>
                <Label htmlFor="ktx2-output-type-select">Output Type</Label>
                <div className="pt-1">
                  <Select
                    value={ktx2Options.outputType}
                    onValueChange={(value: KTX2OutputType) =>
                      handleKtx2OptionChange("outputType", value)
                    }
                    disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                  >
                    <SelectTrigger id="ktx2-output-type-select">
                      <SelectValue placeholder="Select Output Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UASTC">UASTC</SelectItem>
                      <SelectItem value="ETC1S">ETC1S</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Automatically creates smaller image levels from the source, improving rendering performance at distance.">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ktx2-generate-mipmaps"
                  checked={ktx2Options.generateMipmaps}
                  onCheckedChange={(value) =>
                    handleKtx2OptionChange("generateMipmaps", value)
                  }
                  disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                />
                <Label htmlFor="ktx2-generate-mipmaps">Generate Mipmaps</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Optimizes compression parameters specifically for normal maps rather than color data.">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ktx2-normal-map"
                  checked={ktx2Options.isNormalMap}
                  onCheckedChange={(value) =>
                    handleKtx2OptionChange("isNormalMap", value)
                  }
                  disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                />
                <Label htmlFor="ktx2-normal-map">Normal Map</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Indicates whether the source texture uses sRGB color space. Enable for color/albedo textures, disable for data textures like normal or roughness maps.">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ktx2-srgb"
                  checked={ktx2Options.srgbTransferFunction}
                  onCheckedChange={(value) =>
                    handleKtx2OptionChange("srgbTransferFunction", value)
                  }
                  disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                />
                <Label htmlFor="ktx2-srgb">sRGB Transfer Function</Label>
              </div>
            </TooltipWrapper>

            {ktx2Options.outputType === "UASTC" && (
              <TooltipWrapper content="Applies Zstandard compression on top of UASTC texture compression for smaller file sizes with no additional quality loss.">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ktx2-supercompression"
                    checked={ktx2Options.enableSupercompression}
                    onCheckedChange={(value) =>
                      handleKtx2OptionChange("enableSupercompression", value)
                    }
                    disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                  />
                  <Label htmlFor="ktx2-supercompression">
                    Enable Supercompression
                  </Label>
                </div>
              </TooltipWrapper>
            )}

            {ktx2Options.outputType === "UASTC" && (
              <TooltipWrapper content="Rate Distortion Optimization reduces file size by allowing controlled quality loss. Works best with supercompression enabled.">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ktx2-rdo"
                    checked={ktx2Options.enableRDO}
                    onCheckedChange={(value) =>
                      handleKtx2OptionChange("enableRDO", value)
                    }
                    disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                  />
                  <Label htmlFor="ktx2-rdo">Enable RDO</Label>
                </div>
              </TooltipWrapper>
            )}

            {ktx2Options.outputType === "UASTC" && ktx2Options.enableRDO && (
              <TooltipWrapper content="Controls the quality vs. file size tradeoff. Lower values (0.1-2) prioritize quality, higher values (2-10) prioritize smaller file sizes.">
                <div>
                  <Label htmlFor="ktx2-rdo-quality-slider">
                    RDO Quality Level: {ktx2Options.rdoQualityLevel.toFixed(1)}
                  </Label>
                  <Slider
                    id="ktx2-rdo-quality-slider"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={[ktx2Options.rdoQualityLevel]}
                    onValueChange={(value: number[]) => {
                      lastRdoQuality.current = value;
                      setKtx2Options({ ...ktx2Options, rdoQualityLevel: value[0] });
                    }}
                    onValueCommit={(value: number[]) => {
                      const finalValue = lastRdoQuality.current.length
                        ? lastRdoQuality.current[0]
                        : value[0];
                      lastRdoQuality.current = [];
                      handleKtx2OptionChange("rdoQualityLevel", finalValue);
                    }}
                    onLostPointerCapture={() => {
                      if (!lastRdoQuality.current.length) return;
                      const finalValue = lastRdoQuality.current[0];
                      lastRdoQuality.current = [];
                      handleKtx2OptionChange("rdoQualityLevel", finalValue);
                    }}
                    disabled={!compressionEnabled || textureSlots.length === 0 || isBulkProcessing || modifyingKTX2Texture}
                    className="pt-4 pb-1"
                  />
                </div>
              </TooltipWrapper>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="original-size"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          Original Size: {formatSize(originalImageSize)}
        </Label>
      </div>

      {compressionEnabled && (
        <div className="space-y-2">
          <Label htmlFor="compressed-size">
            Compressed Size: {formatSize(compressedImageSize)}
            {percentChangeInImageSize !== 0 && percentChangeInImageSize > 0 && (
              <span className="text-green-400">
                {" "}
                ↓ {percentChangeInImageSize.toFixed(1)}%
              </span>
            )}
            {percentChangeInImageSize !== 0 && percentChangeInImageSize < 0 && (
              <span className="text-red-400">
                {" "}
                ↑ {Math.abs(percentChangeInImageSize).toFixed(1)}%
              </span>
            )}
          </Label>
        </div>
      )}
    </div>
  );
}
