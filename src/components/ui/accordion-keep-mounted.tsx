import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
    forceMount?: boolean;
  }
>(({ className, children, forceMount = true, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    forceMount={forceMount}
    className={cn(
      "overflow-hidden text-sm transition-all duration-300",
      "data-[state=closed]:max-h-0 data-[state=closed]:opacity-0 data-[state=closed]:py-0",
      "data-[state=open]:max-h-[9999px] data-[state=open]:opacity-100",
      className
    )}
    {...props}
  >
    <div className={className}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent };
