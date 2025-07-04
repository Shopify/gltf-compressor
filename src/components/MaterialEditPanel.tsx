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
  compressDocumentTexture,
  getAvailableMaterialNames,
  getMaterialbyName,
  getMaterialTextureBySlot,
} from "@/utils/documentUtils";
import {
  getTexturesFromMaterial,
  getTextureSlotsFromMaterial,
} from "@/utils/utils";
import { useEffect, useState } from "react";

const generateMaxDimensionOptions = (maxDim: number): string[] => {
  const options = [maxDim.toString()];
  const standardSizes = [8192, 4096, 2048, 1024, 512, 256, 128];

  for (const size of standardSizes) {
    if (size < maxDim) {
      options.push(size.toString());
    }
  }

  return options;
};

export default function MaterialEditPanel() {
  const {
    originalDocument,
    selectedTextureSlot,
    selectedTexture,
    selectedMaterial,
    compressionSettings,
    setSelectedMaterial,
    setSelectedTextureSlot,
    setSelectedTexture,
    updateTextureCompressionSettings,
    updateModelStats,
    setTextureCompressing,
  } = useModelStore();

  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [textureSlots, setTextureSlots] = useState<string[]>([]);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [imageFormat, setImageFormat] = useState("image/jpeg");
  const [maxDimension, setMaxDimension] = useState(0);
  const [maxDimensionOptions, setMaxDimensionOptions] = useState<string[]>([]);

  useEffect(() => {
    if (originalDocument) {
      const names = getAvailableMaterialNames(originalDocument);
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
        setMaxDimension(maxDimension);
        setMaxDimensionOptions(generateMaxDimensionOptions(maxDimension));
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
      const textureSettings =
        compressionSettings?.textures.get(selectedTexture);
      const isCompressed = textureSettings?.compressionEnabled ?? false;
      const textureQuality = textureSettings?.quality ?? 0.8;
      const imageFormat = textureSettings?.type ?? "image/jpeg";
      const maxDimension = textureSettings?.maxDimension ?? 0;
      const size = selectedTexture.getSize() ?? [0, 0];
      const originalMaxDimension = Math.max(size[0], size[1]);
      setCompressionEnabled(isCompressed);
      setQuality(textureQuality);
      setImageFormat(imageFormat);
      setMaxDimension(maxDimension);
      setMaxDimensionOptions(generateMaxDimensionOptions(originalMaxDimension));
    } else {
      // Reset to default values when no texture is selected
      setCompressionEnabled(false);
      setQuality(0.8);
      setImageFormat("image/jpeg");
      setMaxDimension(0);
      setMaxDimensionOptions(["0"]);
    }
  }, [selectedTexture, compressionSettings]);

  const handleMaterialChange = (value: string) => {
    if (value && originalDocument) {
      const material = getMaterialbyName(originalDocument, value);
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
      const texture = getMaterialTextureBySlot(selectedMaterial, value);
      setSelectedTexture(texture);
      setSelectedTextureSlot(value);
    }
  };

  const handleCompressionChange = async (value: boolean) => {
    if (selectedMaterial && selectedTexture) {
      setCompressionEnabled(value);

      if (value) {
        const textureCompressionSettings =
          compressionSettings?.textures.get(selectedTexture);
        if (textureCompressionSettings) {
          // Mark texture as compressing
          setTextureCompressing(selectedTexture, true);

          try {
            await compressDocumentTexture(
              selectedTexture,
              textureCompressionSettings
            );
            // Only update the compression settings after compression is complete
            updateTextureCompressionSettings(selectedTexture, {
              compressionEnabled: value,
            });
            updateModelStats();
          } finally {
            // Always mark as not compressing when done
            setTextureCompressing(selectedTexture, false);
          }
        }
      } else {
        // If disabling compression, restore original texture
        const compressedTexture =
          compressionSettings?.textures.get(selectedTexture)?.compressed;
        if (compressedTexture) {
          compressedTexture.setImage(selectedTexture.getImage()!);
          compressedTexture.setMimeType(selectedTexture.getMimeType()!);
        }

        // If disabling compression, update immediately
        updateTextureCompressionSettings(selectedTexture, {
          compressionEnabled: value,
        });
        updateModelStats();
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
        compressionSettings?.textures.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressDocumentTexture(selectedTexture, {
            ...textureCompressionSettings,
            quality: value[0],
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
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
        type: value,
      });

      // Re-compress with new format if compression is enabled
      const textureCompressionSettings =
        compressionSettings?.textures.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressDocumentTexture(selectedTexture, {
            ...textureCompressionSettings,
            type: value,
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
        }
      }
    } else if (selectedTexture) {
      // Just update the format setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        type: value,
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
        compressionSettings?.textures.get(selectedTexture);
      if (textureCompressionSettings) {
        // Mark texture as compressing
        setTextureCompressing(selectedTexture, true);

        try {
          await compressDocumentTexture(selectedTexture, {
            ...textureCompressionSettings,
            maxDimension: newMaxDimension,
          });
          updateModelStats();
        } finally {
          // Always mark as not compressing when done
          setTextureCompressing(selectedTexture, false);
        }
      }
    } else if (selectedTexture) {
      // Just update the format setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        maxDimension: newMaxDimension,
      });
    }
  };

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
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
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
          Max Dimension
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
    </div>
  );
}
