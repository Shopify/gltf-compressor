import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { exportDocument } from "@/utils/fileIO";

import { TooltipWrapper } from "./TooltipWrapper";

export function ExportPanel() {
  const [dracoCompress, setDracoCompress] = useState(false);
  const [optimizeMeshes, setOptimizeMeshes] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [deduplicate, setDeduplicate] = useState(false);
  const [flattenAndJoin, setFlattenAndJoin] = useState(false);
  const [weld, setWeld] = useState(false);
  const [resample, setResample] = useState(false);
  const [prune, setPrune] = useState(false);

  useEffect(() => {
    if (optimizeMeshes && !showAdvanced) {
      setDeduplicate(true);
      setFlattenAndJoin(true);
      setWeld(true);
      setResample(true);
      setPrune(true);
    }
  }, [optimizeMeshes, showAdvanced]);

  useEffect(() => {
    if (
      showAdvanced &&
      !deduplicate &&
      !flattenAndJoin &&
      !weld &&
      !resample &&
      !prune
    ) {
      setShowAdvanced(false);
      setOptimizeMeshes(false);
    }
  }, [deduplicate, flattenAndJoin, weld, resample, prune, showAdvanced]);

  const handleOptimizeMeshesChange = (checked: boolean) => {
    setOptimizeMeshes(checked);
    if (!checked) {
      setShowAdvanced(false);
      setDeduplicate(false);
      setFlattenAndJoin(false);
      setWeld(false);
      setResample(false);
      setPrune(false);
    }
  };

  const handleExport = async () => {
    const modifiedDocument = useModelStore.getState().modifiedDocument;

    if (!modifiedDocument) return;

    try {
      await exportDocument(
        modifiedDocument,
        dracoCompress,
        deduplicate,
        flattenAndJoin,
        weld,
        resample,
        prune
      );
    } finally {
      toast.success("glTF file exported successfully!");
      useViewportStore.setState({ showConfetti: true });
    }
  };

  return (
    <div className="space-y-3 pt-1 pb-2">
      <TooltipWrapper content="Compress mesh geometry with Draco">
        <div className="flex items-center space-x-2 pt-1">
          <Switch
            id="draco-compress-switch"
            checked={dracoCompress}
            onCheckedChange={setDracoCompress}
          />
          <Label htmlFor="draco-compress-switch">Draco Compress</Label>
        </div>
      </TooltipWrapper>

      <TooltipWrapper content="Enable to see advanced options">
        <div className="flex items-center space-x-2 pt-1">
          <Switch
            id="optimize-meshes-and-animations-switch"
            checked={optimizeMeshes}
            onCheckedChange={handleOptimizeMeshesChange}
          />
          <Label htmlFor="optimize-meshes-and-animations-switch">
            Optimize Meshes & Animations
          </Label>
        </div>
      </TooltipWrapper>

      {optimizeMeshes && (
        <div>
          <div
            className="flex items-center space-x-2 cursor-pointer select-none hover:underline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowAdvanced(!showAdvanced);
              }
            }}
            tabIndex={0}
            role="button"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="text-sm text-muted-foreground">
              Advanced Options
            </span>
          </div>
          {showAdvanced && (
            <div className="pl-1.5 pt-1">
              <span className="text-xs text-muted-foreground">
                Hover over the options to see details
              </span>
            </div>
          )}
        </div>
      )}

      {showAdvanced && (
        <div className="pl-1.5 pb-1">
          <div className="space-y-3 pl-3 border-l-2 border-muted">
            <TooltipWrapper content="Remove duplicate meshes, materials, textures, etc.">
              <div className="flex items-center space-x-2">
                <Switch
                  id="deduplicate-switch"
                  checked={deduplicate}
                  onCheckedChange={setDeduplicate}
                />
                <Label htmlFor="deduplicate-switch">Deduplicate</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Reduce nesting of the scene graph and join compatible meshes">
              <div className="flex items-center space-x-2">
                <Switch
                  id="flatten-and-join-switch"
                  checked={flattenAndJoin}
                  onCheckedChange={setFlattenAndJoin}
                />
                <Label htmlFor="flatten-and-join-switch">Flatten & Join</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Index all mesh geometry, removing duplicate vertices">
              <div className="flex items-center space-x-2">
                <Switch
                  id="weld-switch"
                  checked={weld}
                  onCheckedChange={setWeld}
                />
                <Label htmlFor="weld-switch">Weld</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Losslessly resample animation frames">
              <div className="flex items-center space-x-2">
                <Switch
                  id="resample-switch"
                  checked={resample}
                  onCheckedChange={setResample}
                />
                <Label htmlFor="resample-switch">Resample</Label>
              </div>
            </TooltipWrapper>

            <TooltipWrapper content="Remove unused nodes, textures, materials, etc.">
              <div className="flex items-center space-x-2">
                <Switch
                  id="prune-switch"
                  checked={prune}
                  onCheckedChange={setPrune}
                />
                <Label htmlFor="prune-switch">Prune</Label>
              </div>
            </TooltipWrapper>
          </div>
        </div>
      )}

      <div className="pt-1">
        <Button onClick={handleExport} className="w-full">
          Export
        </Button>
      </div>
    </div>
  );
}
