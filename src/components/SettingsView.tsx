import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { useRef } from "react";
import Draggable from "react-draggable";
import { ExportPanel } from "./ExportPanel";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";

export default function SettingsView() {
  const nodeRef = useRef(null);

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef}>
      <Card
        ref={nodeRef}
        className="w-80 absolute top-4 right-4 max-h-[calc(100vh-2rem)]"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Settings</CardTitle>
          <GripVertical className="h-4 w-4 opacity-50 cursor-move drag-handle" />
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
          <ViewportSettingsPanel />
          <MaterialEditPanel />
          <ExportPanel />
        </CardContent>
      </Card>
    </Draggable>
  );
}
