import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { exportDocument } from "@/utils/utils";
import { useState } from "react";

export function ExportPanel() {
  const [dracoCompress, setDracoCompress] = useState(false);
  const { modifiedDocument } = useModelStore();

  const handleExport = async () => {
    if (!modifiedDocument) return;
    await exportDocument(modifiedDocument, dracoCompress);
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
      <Button onClick={handleExport} className="w-full">
        Export
      </Button>
    </div>
  );
}
