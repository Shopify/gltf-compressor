"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import Draggable from "react-draggable";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";

export default function CombinedSettingsPanel() {
  return (
    <Draggable handle=".drag-handle">
      <Card className="w-80 absolute top-4 right-4 max-h-[calc(100vh-2rem)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Settings</CardTitle>
          <GripVertical className="h-4 w-4 opacity-50 cursor-move drag-handle" />
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
          <ViewportSettingsPanel />
          <MaterialEditPanel />
        </CardContent>
      </Card>
    </Draggable>
  );
}
