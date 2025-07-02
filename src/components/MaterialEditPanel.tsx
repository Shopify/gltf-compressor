import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  } = useModelStore();

  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [textureSlots, setTextureSlots] = useState<string[]>([]);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [quality, setQuality] = useState(0.8);

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
      setCompressionEnabled(isCompressed);
      setQuality(textureQuality);
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
          await compressDocumentTexture(
            selectedTexture,
            textureCompressionSettings
          );
          // Only update the compression settings after compression is complete
          updateTextureCompressionSettings(selectedTexture, {
            compressionEnabled: value,
          });
          updateModelStats();
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

  const handleQualityChange = async (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;

    setQuality(numValue);

    if (selectedTexture && compressionEnabled) {
      // Update the quality in compression settings
      updateTextureCompressionSettings(selectedTexture, {
        quality: numValue,
      });

      // Re-compress with new quality if compression is enabled
      const textureCompressionSettings =
        compressionSettings?.textures.get(selectedTexture);
      if (textureCompressionSettings) {
        await compressDocumentTexture(selectedTexture, {
          ...textureCompressionSettings,
          quality: numValue,
        });
        updateModelStats();
      }
    } else if (selectedTexture) {
      // Just update the quality setting even if compression is disabled
      updateTextureCompressionSettings(selectedTexture, {
        quality: numValue,
      });
    }
  };

  return (
    <div className="space-y-4">
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
        <Label htmlFor="texture-select">Texture</Label>
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

      <div className="flex items-center space-x-2">
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
          htmlFor="quality-input"
          className={
            !compressionEnabled || textureSlots.length === 0
              ? "text-muted-foreground"
              : ""
          }
        >
          Quality
        </Label>
        <Input
          id="quality-input"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={quality}
          onChange={(e) => handleQualityChange(e.target.value)}
          disabled={!compressionEnabled || textureSlots.length === 0}
          className="w-full"
        />
      </div>
    </div>
  );
}
