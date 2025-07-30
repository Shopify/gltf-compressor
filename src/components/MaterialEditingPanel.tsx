import { Material } from "@gltf-transform/core";
import { useEffect, useRef, useState } from "react";
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

  // The Shadcn slider component has a bug where it doesn't always call onValueCommit when you release the slider
  // See this issue for more details: https://github.com/radix-ui/primitives/issues/1760
  // This is a workaround to ensure that the quality is always updated correctly when the slider is released
  const lastQuality = useRef<number[]>([]);

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
        // Update compression setting and flag texture as compressing
        updateTextureCompressionSettings(selectedTexture, {
          compressionEnabled: true,
          isBeingCompressed: true,
        });

        try {
          await compressTexture(selectedTexture, textureCompressionSettings);
        } finally {
          // Flag texture as done compressing
          updateTextureCompressionSettings(selectedTexture, {
            isBeingCompressed: false,
          });

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
        // Update compression setting and flag texture as compressing
        updateTextureCompressionSettings(selectedTexture, {
          [settingKey]: value,
          isBeingCompressed: true,
        });

        try {
          await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            [settingKey]: value,
          });
        } finally {
          // Flag texture as done compressing
          updateTextureCompressionSettings(selectedTexture, {
            isBeingCompressed: false,
          });

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
          disabled={materials.length === 0}
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
          disabled={textureSlots.length === 0}
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
          disabled={materials.length === 0}
        />
        <Label
          htmlFor="double-sided-material-switch"
          className={materials.length === 0 ? "text-muted-foreground" : ""}
        >
          Double-Sided Material
        </Label>
      </div>

      <TooltipWrapper
        content={
          mimeType === "image/ktx2"
            ? "Compression is currently not supported for KTX2 textures"
            : ""
        }
      >
        <div className="flex items-center space-x-2 pt-1">
          <Switch
            id="compress-texture-switch"
            checked={compressionEnabled}
            onCheckedChange={handleCompressionChange}
            disabled={textureSlots.length === 0 || mimeType === "image/ktx2"}
          />
          <Label
            htmlFor="compress-texture-switch"
            className={textureSlots.length === 0 ? "text-muted-foreground" : ""}
          >
            Compress Texture
          </Label>
        </div>
      </TooltipWrapper>

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
          disabled={!compressionEnabled || textureSlots.length === 0}
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
            {mimeType === "image/ktx2" && (
              <SelectItem key="image-format-ktx2" value="image/ktx2">
                KTX2
              </SelectItem>
            )}
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
          disabled={!compressionEnabled || textureSlots.length === 0}
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
        disabled={!compressionEnabled || textureSlots.length === 0}
        className="pt-4 pb-1"
      />

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
