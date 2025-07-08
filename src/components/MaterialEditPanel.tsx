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
import {
  compressTexture,
  formatSize,
  getMaterialByName,
  getMaterialNames,
  getMaxDimensionOptions,
  getTextureBySlotName,
  getTexturesFromMaterial,
  getTextureSlotsFromMaterial,
  getTextureWeightInKB,
} from "@/utils/utils";
import { useEffect, useState } from "react";

export default function MaterialEditPanel() {
  const {
    originalDocument,
    selectedTextureSlot,
    selectedTexture,
    selectedMaterial,
    textureCompressionSettingsMap,
    setSelectedMaterial,
    setSelectedTextureSlot,
    setSelectedTexture,
    updateTextureCompressionSettings,
    updateModelStats,
    setTextureCompressing,
    setShowingCompressedTexture,
  } = useModelStore();

  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [textureSlots, setTextureSlots] = useState<string[]>([]);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [imageFormat, setImageFormat] = useState("image/jpeg");
  const [maxDimension, setMaxDimension] = useState(0);
  const [maxDimensionOptions, setMaxDimensionOptions] = useState<string[]>([]);
  const [originalImageWeight, setOriginalImageWeight] = useState(0);
  const [compressedImageWeight, setCompressedImageWeight] = useState(0);
  const [savedCompressedData, setSavedCompressedData] = useState<{
    imageData: Uint8Array | null;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    if (originalDocument) {
      const names = getMaterialNames(originalDocument);
      setMaterialNames(names);
      const firstMaterial = originalDocument.getRoot().listMaterials()[0];
      if (firstMaterial) {
        setSelectedMaterial(firstMaterial);
        const { slot, texture: firstTexture } =
          getTexturesFromMaterial(firstMaterial)?.[0] ?? {};
        setSelectedTextureSlot(slot ?? "");
        setSelectedTexture(firstTexture);
        const size = firstTexture?.getSize() ?? [0, 0];
        const maxDimension = Math.max(size[0], size[1]);
        const weight = getTextureWeightInKB(firstTexture);
        setMaxDimension(maxDimension);
        setMaxDimensionOptions(getMaxDimensionOptions(maxDimension));
        setOriginalImageWeight(weight);
      }
    }
  }, [
    originalDocument,
    setSelectedMaterial,
    setSelectedTextureSlot,
    setSelectedTexture,
  ]);

  useEffect(() => {
    if (selectedMaterial) {
      const slots = getTextureSlotsFromMaterial(selectedMaterial);
      setTextureSlots(slots);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    if (selectedTexture) {
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
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
      setCompressionEnabled(isCompressed);
      setQuality(textureQuality);
      setImageFormat(imageFormat);
      setMaxDimension(maxDimension);
      setMaxDimensionOptions(getMaxDimensionOptions(originalMaxDimension));
      setOriginalImageWeight(weight);
      setCompressedImageWeight(compressedWeight);
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
      setShowingCompressedTexture(false);
    }
  }, [selectedTexture, textureCompressionSettingsMap]);

  const handleMaterialChange = (value: string) => {
    if (value && originalDocument) {
      const material = getMaterialByName(originalDocument, value);
      if (material) {
        const textures = getTexturesFromMaterial(material);
        const { slot, texture: firstTexture } = textures?.[0] ?? {};
        setSelectedMaterial(material);
        setSelectedTexture(firstTexture);
        setSelectedTextureSlot(slot ?? "");
      }
    }
  };

  const handleTextureChange = (value: string) => {
    if (value && originalDocument && selectedMaterial) {
      const texture = getTextureBySlotName(selectedMaterial, value);
      setSelectedTexture(texture);
      setSelectedTextureSlot(value);
    }
  };

  const handleCompressionChange = async (value: boolean) => {
    if (selectedMaterial && selectedTexture) {
      setCompressionEnabled(value);

      if (value) {
        const textureCompressionSettings =
          textureCompressionSettingsMap?.get(selectedTexture);
        if (textureCompressionSettings) {
          // Mark texture as compressing
          setTextureCompressing(selectedTexture, true);

          try {
            await compressTexture(selectedTexture, textureCompressionSettings);
            // Only update the compression settings after compression is complete
            updateTextureCompressionSettings(selectedTexture, {
              compressionEnabled: value,
            });
            updateModelStats();
          } finally {
            // Always mark as not compressing when done
            setTextureCompressing(selectedTexture, false);
            const weight = getTextureWeightInKB(
              textureCompressionSettings.compressedTexture
            );
            setCompressedImageWeight(weight);
            setShowingCompressedTexture(true);
          }
        }
      } else {
        // If disabling compression, restore original texture
        const compressedTexture =
          textureCompressionSettingsMap?.get(
            selectedTexture
          )?.compressedTexture;
        if (compressedTexture) {
          compressedTexture.setImage(selectedTexture.getImage()!);
          compressedTexture.setMimeType(selectedTexture.getMimeType()!);
        }

        // If disabling compression, update immediately
        updateTextureCompressionSettings(selectedTexture, {
          compressionEnabled: value,
        });
        updateModelStats();
        setShowingCompressedTexture(false);
      }
    }
  };

  const handleQualityChange = async (value: number[]) => {
    setQuality(value[0]);

    if (selectedTexture && compressionEnabled) {
      // Update the quality in compression settings
      updateTextureCompressionSettings(selectedTexture, {
        quality: value[0],
      });

      // Re-compress with new quality if compression is enabled
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            quality: value[0],
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
          const weight = getTextureWeightInKB(
            textureCompressionSettings.compressedTexture
          );
          setCompressedImageWeight(weight);
        }
      }
    } else if (selectedTexture) {
      // Just update the quality setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        quality: value[0],
      });
    }
  };

  const handleFormatChange = async (value: string) => {
    setImageFormat(value);

    if (selectedTexture && compressionEnabled) {
      // Update the format in compression settings
      updateTextureCompressionSettings(selectedTexture, {
        mimeType: value,
      });

      // Re-compress with new format if compression is enabled
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            mimeType: value,
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
          const weight = getTextureWeightInKB(
            textureCompressionSettings.compressedTexture
          );
          setCompressedImageWeight(weight);
        }
      }
    } else if (selectedTexture) {
      // Just update the format setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        mimeType: value,
      });
    }
  };

  const handleMaxDimensionChange = async (value: string) => {
    const newMaxDimension = parseInt(value);
    setMaxDimension(newMaxDimension);

    if (selectedTexture && compressionEnabled) {
      // Update the format in compression settings
      updateTextureCompressionSettings(selectedTexture, {
        maxDimension: newMaxDimension,
      });

      // Re-compress with new format if compression is enabled
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressTexture(selectedTexture, {
            ...textureCompressionSettings,
            maxDimension: newMaxDimension,
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
          const weight = getTextureWeightInKB(
            textureCompressionSettings.compressedTexture
          );
          setCompressedImageWeight(weight);
        }
      }
    } else if (selectedTexture) {
      // Just update the format setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        maxDimension: newMaxDimension,
      });
    }
  };

  const handleShowCompressedTexture = () => {
    if (selectedTexture && savedCompressedData) {
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
      if (
        textureCompressionSettings?.compressedTexture &&
        textureCompressionSettings.compressionEnabled
      ) {
        console.log("*** Restoring compressed image");

        // Restore the saved compressed image data
        textureCompressionSettings.compressedTexture.setImage(
          savedCompressedData.imageData!
        );
        textureCompressionSettings.compressedTexture.setMimeType(
          savedCompressedData.mimeType
        );

        // Clear saved data
        setSavedCompressedData(null);

        setShowingCompressedTexture(true);
      }
    }
  };

  const handleShowUncompressedTexture = () => {
    if (selectedTexture) {
      const textureCompressionSettings =
        textureCompressionSettingsMap?.get(selectedTexture);
      if (
        textureCompressionSettings?.compressedTexture &&
        textureCompressionSettings.compressionEnabled
      ) {
        // Save the current compressed image data before switching to original
        const compressedTexture = textureCompressionSettings.compressedTexture;
        const currentImageData = compressedTexture.getImage();
        const currentMimeType = compressedTexture.getMimeType();

        if (currentImageData) {
          // Store the compressed data
          setSavedCompressedData({
            imageData: currentImageData.slice(),
            mimeType: currentMimeType,
          });

          console.log("*** Showing original image");
          // Set to original image
          compressedTexture.setImage(selectedTexture.getImage()!);
          compressedTexture.setMimeType(selectedTexture.getMimeType()!);

          setShowingCompressedTexture(false);
        }
      }
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
  }, [handleShowCompressedTexture, handleShowUncompressedTexture]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="material-select">Material</Label>
        <Select
          value={selectedMaterial?.getName()}
          onValueChange={handleMaterialChange}
        >
          <SelectTrigger id="material-select">
            <SelectValue placeholder="Select material" />
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
        </Label>
      </div>

      <div className="space-y-2">
        <Button
          onMouseDown={handleShowUncompressedTexture}
          onMouseUp={handleShowCompressedTexture}
          onMouseLeave={handleShowCompressedTexture}
          disabled={!compressionEnabled || textureSlots.length === 0}
          className="w-full"
        >
          Hold to Show Uncompressed Texture
        </Button>
      </div>
    </div>
  );
}
