import { cn } from "@/lib/utils";
import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "hsl(var(--primary))",
  colorTo = "hsl(var(--primary))",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width,1px)*1)_solid_transparent]",
        className
      )}
      style={{
        "--size": size,
        "--duration": duration,
        "--border-width": borderWidth,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        "--delay": `-${delay}s`,
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 rounded-[inherit] animate-pulse"
        style={{
          background: `linear-gradient(45deg, ${colorFrom}, ${colorTo})`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}
