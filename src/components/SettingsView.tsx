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
          <AccordionContent className="px-4 py-2 bg-background">
            <ViewportSettingsPanel />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="material" className="border-b">
          <AccordionTrigger className="bg-secondary px-4 py-2">
            Material Edit
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 bg-background">
            <MaterialEditPanel />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="export" className="border-b">
          <AccordionTrigger className="bg-secondary px-4 py-2">
            Export
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 bg-background">
            <ExportPanel />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  );
}
