import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { exportDocument } from "@/utils/utils";
import { useState } from "react";

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
      <div className="flex items-center space-x-2">
        <Switch
          id="draco-compression"
          checked={dracoCompress}
          onCheckedChange={setDracoCompress}
        />
        <Label htmlFor="draco-compression">Use Draco Compression</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="deduplicate"
          checked={deduplicate}
          onCheckedChange={setDeduplicate}
        />
        <Label htmlFor="deduplicate">Deduplicate</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="flatten-and-join"
          checked={flattenAndJoin}
          onCheckedChange={setFlattenAndJoin}
        />
        <Label htmlFor="flatten-and-join">Flatten and Join</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="weld" checked={weld} onCheckedChange={setWeld} />
        <Label htmlFor="weld">Weld</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="resample"
          checked={resample}
          onCheckedChange={setResample}
        />
        <Label htmlFor="resample">Resample</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="prune" checked={prune} onCheckedChange={setPrune} />
        <Label htmlFor="prune">Prune</Label>
      </div>
      <Button onClick={handleExport} className="w-full">
        Export
      </Button>
    </div>
  );
}
