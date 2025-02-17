"use client";

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
      className="w-full"
      defaultValue={["viewport", "material", "export"]}
    >
      <AccordionItem value="viewport" className="border-b">
        <AccordionTrigger className="bg-secondary hover:bg-secondary/80 px-4 py-2 transition-colors">
          Viewport Settings
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2 bg-background">
          <ViewportSettingsPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="material" className="border-b">
        <AccordionTrigger className="bg-secondary hover:bg-secondary/80 px-4 py-2 transition-colors">
          Material Edit
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2 bg-background">
          <MaterialEditPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="export" className="border-b">
        <AccordionTrigger className="bg-secondary hover:bg-secondary/80 px-4 py-2 transition-colors">
          Export
        </AccordionTrigger>
        <AccordionContent className="px-4 py-2 bg-background">
          <ExportPanel />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
