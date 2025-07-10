"use client";

import {
  Accordion,
  AccordionContentWithForceMount,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExportPanel } from "./ExportPanel";
import MaterialEditPanel from "./MaterialEditPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";
import { TooltipProvider } from "./ui/tooltip";

export default function SettingsView() {
  return (
    <TooltipProvider>
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["viewport", "material", "export"]}
      >
        <AccordionItem value="viewport" className="border-b">
          <AccordionTrigger className="bg-secondary px-4 py-2">
            Viewport Settings
          </AccordionTrigger>
          <AccordionContentWithForceMount className="px-2 py-1 bg-background">
            <ViewportSettingsPanel />
          </AccordionContentWithForceMount>
        </AccordionItem>
        <AccordionItem value="material" className="border-b">
          <AccordionTrigger className="bg-secondary px-4 py-2">
            Material Edit
          </AccordionTrigger>
          <AccordionContentWithForceMount className="px-2 py-1 bg-background">
            <MaterialEditPanel />
          </AccordionContentWithForceMount>
        </AccordionItem>
        <AccordionItem value="export" className="border-b">
          <AccordionTrigger className="bg-secondary px-4 py-2">
            Export
          </AccordionTrigger>
          <AccordionContentWithForceMount className="px-2 py-1 bg-background">
            <ExportPanel />
          </AccordionContentWithForceMount>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  );
}
