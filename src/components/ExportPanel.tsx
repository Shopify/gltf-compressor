import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { exportDocument } from "@/utils/utils";
import { useState } from "react";
import { SimpleTooltip } from "./SimpleTooltip";

export function ExportPanel() {
  const [dracoCompress, setDracoCompress] = useState(false);
  const [deduplicate, setDeduplicate] = useState(false);
  const [flattenAndJoin, setFlattenAndJoin] = useState(false);
  const [weld, setWeld] = useState(false);
  const [resample, setResample] = useState(false);
  const [prune, setPrune] = useState(false);
  const { modifiedDocument } = useModelStore();

  const handleExport = async () => {
    if (!modifiedDocument) return;
    await exportDocument(
      modifiedDocument,
      dracoCompress,
      deduplicate,
      flattenAndJoin,
      weld,
      resample,
      prune
    );
  };

  return (
    <div className="space-y-2">
      <SimpleTooltip content="Compress mesh geometry with Draco">
        <div className="flex items-center space-x-2">
          <Switch
            id="draco-compression"
            checked={dracoCompress}
            onCheckedChange={setDracoCompress}
          />
          <Label htmlFor="draco-compression">Draco Compress</Label>
        </div>
      </SimpleTooltip>
      <SimpleTooltip content="Remove duplicate meshes, materials, textures, etc.">
        <div className="flex items-center space-x-2">
          <Switch
            id="deduplicate"
            checked={deduplicate}
            onCheckedChange={setDeduplicate}
          />
          <Label htmlFor="deduplicate">Deduplicate</Label>
        </div>
      </SimpleTooltip>
      <SimpleTooltip content="Reduce nesting of the scene graph and join compatible meshes">
        <div className="flex items-center space-x-2">
          <Switch
            id="flatten-and-join"
            checked={flattenAndJoin}
            onCheckedChange={setFlattenAndJoin}
          />
          <Label htmlFor="flatten-and-join">Flatten and Join</Label>
        </div>
      </SimpleTooltip>
      <SimpleTooltip content="Index all mesh geometry, removing duplicate vertices">
        <div className="flex items-center space-x-2">
          <Switch id="weld" checked={weld} onCheckedChange={setWeld} />
          <Label htmlFor="weld">Weld</Label>
        </div>
      </SimpleTooltip>
      <SimpleTooltip content="Losslessly resample animation frames">
        <div className="flex items-center space-x-2">
          <Switch
            id="resample"
            checked={resample}
            onCheckedChange={setResample}
          />
          <Label htmlFor="resample">Resample</Label>
        </div>
      </SimpleTooltip>
      <SimpleTooltip content="Remove unused nodes, textures, materials, etc.">
        <div className="flex items-center space-x-2">
          <Switch id="prune" checked={prune} onCheckedChange={setPrune} />
          <Label htmlFor="prune">Prune</Label>
        </div>
      </SimpleTooltip>
      <Button onClick={handleExport} className="w-full">
        Export
      </Button>
    </div>
  );
}
