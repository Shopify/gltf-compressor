import { Card } from "@/components/ui/card";
import { ExportPanel } from "./ExportPanel";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";

export default function SettingsView() {
  return (
    <Card className="w-80 absolute top-4 right-4 max-h-[calc(100vh-2rem)]">
      <ViewportSettingsPanel />
      <MaterialEditPanel />
      <ExportPanel />
    </Card>
  );
}
