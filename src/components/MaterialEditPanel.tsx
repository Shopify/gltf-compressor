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
import { restoreOriginalTextureAsync } from "@/utils/textureRestore";
import {
  compressTexture,
  formatSize,
  getMaterialByName,
  getMaterialNames,
  getMaxDimensionOptions,
  getTextureBySlot,
  getTexturesFromMaterial,
  getTextureSlotsFromMaterial,
  getTextureWeightInKB,
} from "@/utils/utils";
import { useEffect, useState } from "react";
import { TooltipWrapper } from "./TooltipWrapper";

export default function MaterialEditPanel() {
  const {
    originalDocument,
    selectedMaterial,
    selectedTextureSlot,
    selectedTexture,
    textureCompressionSettingsMap,
    setSelectedMaterial,
    setSelectedTextureSlot,
    setSelectedTexture,
    updateTextureCompressionSettings,
    updateModelStats,
    updateTexturesBeingCompressed,
    setShowingCompressedTexture,
  } = useModelStore();

  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [textureSlots, setTextureSlots] = useState<string[]>([]);
  const [doubleSided, setDoubleSided] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [imageFormat, setImageFormat] = useState("image/jpeg");
  const [maxDimension, setMaxDimension] = useState(0);
  const [maxDimensionOptions, setMaxDimensionOptions] = useState<string[]>([]);
  const [originalImageWeight, setOriginalImageWeight] = useState(0);
  const [compressedImageWeight, setCompressedImageWeight] = useState(0);
  const [percentChangeInImageWeight, setPercentChangeInImageWeight] =
    useState(0);
  const [savedCompressedData, setSavedCompressedData] = useState<{
    imageData: Uint8Array | null;
    mimeType: string;
  } | null>(null);

  // Initialize panel
  useEffect(() => {
    if (!originalDocument) {
      return;
    }

    const names = getMaterialNames(originalDocument);
    setMaterialNames(names);
    const firstMaterial = originalDocument.getRoot().listMaterials()[0];

    if (!firstMaterial) {
      return;
    }

    setSelectedMaterial(firstMaterial);

    const slots = getTextureSlotsFromMaterial(firstMaterial);
    const textures = getTexturesFromMaterial(firstMaterial);
    const { slot: firstSlot, texture: firstTexture } = textures[0] ?? {};
    const size = firstTexture?.getSize() ?? [0, 0];
    const maxDimension = Math.max(size[0], size[1]);
    const weight = getTextureWeightInKB(firstTexture);

    setTextureSlots(slots ?? []);
    setSelectedTextureSlot(firstSlot ?? "");
    setSelectedTexture(firstTexture ?? null);
    setDoubleSided(firstMaterial.getDoubleSided());
    setMaxDimension(maxDimension);
    setMaxDimensionOptions(getMaxDimensionOptions(maxDimension));
    setOriginalImageWeight(weight);
  }, [originalDocument]);

  // Update texture slots and the selected slot/texture when material changes
  useEffect(() => {
    if (!selectedMaterial) {
      return;
    }

    const slots = getTextureSlotsFromMaterial(selectedMaterial);
    const textures = getTexturesFromMaterial(selectedMaterial);
    const { slot: firstSlot, texture: firstTexture } = textures[0] ?? {};

    setTextureSlots(slots ?? []);
    setSelectedTextureSlot(firstSlot ?? "");
    setSelectedTexture(firstTexture ?? null);
    setDoubleSided(selectedMaterial.getDoubleSided());
  }, [selectedMaterial]);

  // Update compression settings when texture changes
  useEffect(() => {
    if (selectedTexture) {
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      const isCompressed =
        textureCompressionSettings?.compressionEnabled ?? false;
      const textureQuality = textureCompressionSettings?.quality ?? 0.8;
      const imageFormat = textureCompressionSettings?.mimeType ?? "image/jpeg";
      const maxDimension = textureCompressionSettings?.maxDimension ?? 0;
      const size = selectedTexture.getSize() ?? [0, 0];
      const originalMaxDimension = Math.max(size[0], size[1]);
      const weight = getTextureWeightInKB(selectedTexture);
      const compressedWeight = getTextureWeightInKB(
        textureCompressionSettings?.compressedTexture
      );
      const percentChangeInImageWeight =
        weight > 0 ? ((weight - compressedWeight) / weight) * 100 : 0;
      setCompressionEnabled(isCompressed);
      setQuality(textureQuality);
      setImageFormat(imageFormat);
      setMaxDimension(maxDimension);
      setMaxDimensionOptions(getMaxDimensionOptions(originalMaxDimension));
      setOriginalImageWeight(weight);
      setCompressedImageWeight(compressedWeight);
      setPercentChangeInImageWeight(percentChangeInImageWeight);
      setShowingCompressedTexture(isCompressed);
    } else {
      // Reset to default values when no texture is selected
      setCompressionEnabled(false);
      setQuality(0.8);
      setImageFormat("image/jpeg");
      setMaxDimension(0);
      setMaxDimensionOptions(["0"]);
      setOriginalImageWeight(0);
      setCompressedImageWeight(0);
      setPercentChangeInImageWeight(0);
      setShowingCompressedTexture(false);
    }
  }, [selectedTexture]);

  const handleMaterialChange = (value: string) => {
    if (!originalDocument) {
      return;
    }

    const material = getMaterialByName(originalDocument, value);
    if (!material) {
      return;
    }

    setSelectedMaterial(material);
  };

  const handleTextureChange = (value: string) => {
    if (!selectedMaterial) {
      return;
    }

    const texture = getTextureBySlot(selectedMaterial, value);
    setSelectedTextureSlot(value);
    setSelectedTexture(texture);
  };

  const handleDoubleSidedChange = async (value: boolean) => {
    if (!selectedMaterial) {
      return;
    }

    setDoubleSided(value);

    selectedMaterial.setDoubleSided(value);
  };

  const handleCompressionChange = async (value: boolean) => {
    if (!selectedTexture) {
      return;
    }

    setCompressionEnabled(value);

    // Update compression setting
    updateTextureCompressionSettings(selectedTexture, {
      compressionEnabled: value,
    });

    if (value) {
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      if (textureCompressionSettings) {
        // Flag texture as compressing
        updateTexturesBeingCompressed(selectedTexture, true);

        try {
          await compressTexture(selectedTexture, textureCompressionSettings);
        } finally {
          // Flag texture as done compressing
          updateTexturesBeingCompressed(selectedTexture, false);

          // Update user interface
          const weight = getTextureWeightInKB(
            textureCompressionSettings.compressedTexture
          );
          const percentChangeInImageWeight =
            originalImageWeight > 0
              ? ((originalImageWeight - weight) / originalImageWeight) * 100
              : 0;
          setCompressedImageWeight(weight);
          setPercentChangeInImageWeight(percentChangeInImageWeight);
          setShowingCompressedTexture(true);
          updateModelStats();
        }
      }
    } else {
      // Restore original texture because compression is being disabled
      const compressedTexture =
        textureCompressionSettingsMap.get(selectedTexture)?.compressedTexture;
      if (compressedTexture) {
        restoreOriginalTextureAsync(compressedTexture, selectedTexture).then(
          () => {
            // Update user interface
            setShowingCompressedTexture(false);
            updateModelStats();
          }
        );
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

    // Update compression setting
    updateTextureCompressionSettings(selectedTexture, {
      [settingKey]: value,
    });

    if (compressionEnabled) {
      // Re-compress with new setting
      const textureCompressionSettings =
        textureCompressionSettingsMap.get(selectedTexture);
      if (textureCompressionSettings) {
        // Flag texture as compressing
        updateTexturesBeingCompressed(selectedTexture, true);

        try {
          await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            [settingKey]: value,
          });
        } finally {
          // Flag texture as done compressing
          updateTexturesBeingCompressed(selectedTexture, false);

          // Update user interface
          const weight = getTextureWeightInKB(
            textureCompressionSettings.compressedTexture
          );
          const percentChangeInImageWeight =
            originalImageWeight > 0
              ? ((originalImageWeight - weight) / originalImageWeight) * 100
              : 0;
          setCompressedImageWeight(weight);
          setPercentChangeInImageWeight(percentChangeInImageWeight);
          updateModelStats();
        }
      }
    }
  };

  const handleQualityChange = async (value: number[]) => {
    await handleCompressionSettingChange(value[0], setQuality, "quality");
  };

  const handleFormatChange = async (value: string) => {
    await handleCompressionSettingChange(value, setImageFormat, "mimeType");
  };

  const handleMaxDimensionChange = async (value: string) => {
    await handleCompressionSettingChange(
      parseInt(value),
      setMaxDimension,
      "maxDimension"
    );
  };

  const handleShowUncompressedTexture = () => {
    if (!selectedTexture) {
      return;
    }

    const textureCompressionSettings =
      textureCompressionSettingsMap.get(selectedTexture);
    if (
      textureCompressionSettings?.compressedTexture &&
      textureCompressionSettings.compressionEnabled
    ) {
      // Get the image data and mime type of the compressed texture and store it so we can restore it later
      const compressedTexture = textureCompressionSettings.compressedTexture;
      const compressedImageData = compressedTexture.getImage();
      const compressedMimeType = compressedTexture.getMimeType();

      if (compressedImageData) {
        setSavedCompressedData({
          imageData: compressedImageData,
          mimeType: compressedMimeType,
        });

        // Update the compressed texture so it uses the original texture's image data and mime type
        compressedTexture.setImage(selectedTexture.getImage()!);
        compressedTexture.setMimeType(selectedTexture.getMimeType()!);

        // Update user interface
        setShowingCompressedTexture(false);
      }
    }
  };

  const handleShowCompressedTexture = () => {
    if (!selectedTexture || !savedCompressedData) {
      return;
    }

    const textureCompressionSettings =
      textureCompressionSettingsMap.get(selectedTexture);
    if (
      textureCompressionSettings?.compressedTexture &&
      textureCompressionSettings.compressionEnabled
    ) {
      // Restore the image data and mime type of the compressed texture
      textureCompressionSettings.compressedTexture.setImage(
        savedCompressedData.imageData!
      );
      textureCompressionSettings.compressedTexture.setMimeType(
        savedCompressedData.mimeType
      );

      // Clear saved data
      setSavedCompressedData(null);

      // Update user interface
      setShowingCompressedTexture(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyC" && !event.repeat) {
        event.preventDefault();
        handleShowUncompressedTexture();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyC") {
        event.preventDefault();
        // Restore compressed image when spacebar is released
        handleShowCompressedTexture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleShowUncompressedTexture, handleShowCompressedTexture]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="material-select">Material</Label>
        <Select
          value={selectedMaterial?.getName() ?? ""}
          onValueChange={handleMaterialChange}
          disabled={materialNames.length === 0}
        >
          <SelectTrigger id="material-select">
            <SelectValue
              placeholder={
                materialNames.length === 0
                  ? "No materials available"
                  : "Select material"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {materialNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="texture-select"
          className={textureSlots.length === 0 ? "text-muted-foreground" : ""}
        >
          Texture
        </Label>
        <Select
          value={selectedTextureSlot}
          onValueChange={handleTextureChange}
          disabled={textureSlots.length === 0}
        >
          <SelectTrigger id="texture-select">
            <SelectValue
              placeholder={
                textureSlots.length === 0
                  ? "No textures available"
                  : "Select texture"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {textureSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="double-sided-toggle"
          checked={doubleSided}
          onCheckedChange={handleDoubleSidedChange}
          disabled={materialNames.length === 0}
        />
        <Label
          htmlFor="double-sided-toggle"
          className={materialNames.length === 0 ? "text-muted-foreground" : ""}
        >
          Double Sided?
        </Label>
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Switch
          id="compression-toggle"
          checked={compressionEnabled}
          onCheckedChange={handleCompressionChange}
          disabled={textureSlots.length === 0}
        />
        <Label
          htmlFor="compression-toggle"
          className={textureSlots.length === 0 ? "text-muted-foreground" : ""}
        >
          Compress?
        </Label>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="format-select"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          Format
        </Label>
        <Select
          value={imageFormat}
          onValueChange={handleFormatChange}
          disabled={!compressionEnabled || textureSlots.length === 0}
        >
          <SelectTrigger id="format-select">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image/jpeg">JPEG</SelectItem>
            <SelectItem value="image/png">PNG</SelectItem>
            <SelectItem value="image/webp">WEBP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
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
        <div className="flex items-center space-x-2">
          <Slider
            id="quality-slider"
            min={0}
            max={1}
            step={0.01}
            value={[quality]}
            onValueChange={(value: number[]) => {
              setQuality(value[0]);
            }}
            onValueCommit={handleQualityChange}
            disabled={!compressionEnabled || textureSlots.length === 0}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor="max-dimension-select"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          Max Width or Height in Pixels
        </Label>
        <Select
          value={maxDimension.toString()}
          onValueChange={handleMaxDimensionChange}
          disabled={!compressionEnabled || textureSlots.length === 0}
        >
          <SelectTrigger id="max-dimension-select">
            <SelectValue placeholder="Select max dimension" />
          </SelectTrigger>
          <SelectContent>
            {maxDimensionOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="original-image-weight"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          Original Image Size: {formatSize(originalImageWeight)}
        </Label>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="new-image-weight"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          New Image Size: {formatSize(compressedImageWeight)}
          {percentChangeInImageWeight !== 0 &&
            percentChangeInImageWeight > 0 && (
              <span className="text-green-400">
                {" "}
                ↓ {percentChangeInImageWeight.toFixed(1)}%
              </span>
            )}
          {percentChangeInImageWeight !== 0 &&
            percentChangeInImageWeight < 0 && (
              <span className="text-red-400">
                {" "}
                ↑ {Math.abs(percentChangeInImageWeight).toFixed(1)}%
              </span>
            )}
        </Label>
      </div>

      <TooltipWrapper content="Or press & hold the C key on your keyboard">
        <div className="space-y-2">
          <Button
            onMouseDown={handleShowUncompressedTexture}
            onMouseUp={handleShowCompressedTexture}
            onMouseLeave={handleShowCompressedTexture}
            disabled={!compressionEnabled || textureSlots.length === 0}
            className="w-full text-xs"
          >
            Press & Hold to Show Original Texture
          </Button>
        </div>
      </TooltipWrapper>
    </div>
  );
}
