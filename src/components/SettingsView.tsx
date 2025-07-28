"use client";

import { useEffect, useRef } from "react";

import {
  Accordion,
  AccordionContentWithForceMount,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useViewportStore } from "@/stores/useViewportStore";

import { ExportPanel } from "./ExportPanel";
import MaterialEditingPanel from "./MaterialEditingPanel";
import ViewportSettingsPanel from "./ViewportSettingsPanel";
import { TooltipProvider } from "./ui/tooltip";

export default function SettingsView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide confetti when SettingsView is clicked anywhere
    const handleClick = (event: MouseEvent) => {
      if (!useViewportStore.getState().showConfetti || !containerRef.current)
        return;

      // Check if the click is within the SettingsView bounds
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        useViewportStore.setState({ showConfetti: false });
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return (
    <TooltipProvider>
      <div ref={containerRef} className="w-full relative">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={["viewport-settings", "material-editing", "export"]}
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
