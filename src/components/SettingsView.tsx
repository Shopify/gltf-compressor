import { Card } from "@/components/ui/card";
import { ExportPanel } from "./ExportPanel";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";

export default function SettingsView() {
  return (
    <Card>
      <ViewportSettingsPanel />
      <MaterialEditPanel />
      <ExportPanel />
    </Card>
  );
}
