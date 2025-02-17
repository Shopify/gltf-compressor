import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExportPanel } from "./ExportPanel";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";

export default function SettingsView() {
  return (
    <Accordion
      type="multiple"
      className="w-full px-2"
      defaultValue={["viewport", "material", "export"]}
    >
      <AccordionItem value="viewport">
        <AccordionTrigger>Viewport Settings</AccordionTrigger>
        <AccordionContent>
          <ViewportSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="material">
        <AccordionTrigger>Material Edit</AccordionTrigger>
        <AccordionContent>
          <MaterialEditPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="export">
        <AccordionTrigger>Export</AccordionTrigger>
        <AccordionContent>
          <ExportPanel />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
