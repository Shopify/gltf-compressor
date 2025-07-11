import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function TooltipWrapper({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) {
  return content && content.length > 0 ? (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  ) : (
    children
  );
}
