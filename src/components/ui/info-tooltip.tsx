"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  text: string;
  label: string;
  className?: string;
}

export function InfoTooltip({ text, label, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Dismiss on outside pointerdown when opened via click/tap. Radix Tooltip
  // closes naturally on hover-leave / blur / Escape; this only matters for
  // touch users where there is no hover-leave to fall back on.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          // Radix Tooltip ignores mouse-click focus by design; explicit onClick
          // makes the icon respond to mouse clicks and touch taps too.
          onClick={() => setOpen(true)}
          className={cn(
            "relative inline-flex items-center justify-center p-1 -mt-1 -mr-1 -mb-1 ml-[2px] cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            className
          )}
          aria-label={`About ${label}`}
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
