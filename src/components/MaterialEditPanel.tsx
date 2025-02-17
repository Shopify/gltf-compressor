import { Button } from "@/components/ui/button";
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
      const isCompressed =
        compressionSettings?.textures.get(selectedTexture)
          ?.compressionEnabled ?? false;
      setCompressionEnabled(isCompressed);
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

  const handleCompressionChange = (value: boolean) => {
    if (selectedMaterial && selectedTexture) {
      updateTextureCompressionSettings(selectedTexture, {
        compressionEnabled: value,
      });
      setCompressionEnabled(value);
    }
  };

  const handleCompress = async () => {
    // const texture = originalDocument?.getRoot().listTextures()[1];
    // await compressDocumentTexture(
    //   texture,
    //   compressionSettings?.textures.get(texture)
    // );
    updateModelStats();
  };

  return (
    <div className="space-y-4 px-2">
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
        <Select value={selectedTextureSlot} onValueChange={handleTextureChange}>
          <SelectTrigger id="texture-select">
            <SelectValue placeholder="Select texture" />
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
        />
        <Label htmlFor="compression-toggle">Compress?</Label>
      </div>

      <Button onClick={handleCompress} className="w-full">
        Compress
      </Button>
    </div>
  );
}
