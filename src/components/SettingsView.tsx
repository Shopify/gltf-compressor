"use client";

import {
  Accordion,
  AccordionContentWithForceMount,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ExportPanel } from "./ExportPanel";
import MaterialEditingPanel from "./MaterialEditingPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";
import { TooltipProvider } from "./ui/tooltip";

export default function SettingsView() {
  return (
    <TooltipProvider>
      <div className="w-full relative">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={["material-editing", "export"]}
        >
          <AccordionItem value="viewport-settings" className="border-b">
            <AccordionTrigger className="bg-secondary px-4 py-2">
              Viewport Settings
            </AccordionTrigger>
            <AccordionContentWithForceMount className="px-2 py-1 bg-background">
              <ViewportSettingsPanel />
            </AccordionContentWithForceMount>
          </AccordionItem>
          <AccordionItem value="material-editing" className="border-b">
            <AccordionTrigger className="bg-secondary px-4 py-2">
              Material Editing
            </AccordionTrigger>
            <AccordionContentWithForceMount className="px-2 py-1 bg-background">
              <MaterialEditingPanel />
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
      </div>
    </TooltipProvider>
  );
}
