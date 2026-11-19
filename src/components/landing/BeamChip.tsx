import type { ReactNode } from "react";
import { BorderBeam } from "border-beam";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// A chip with cult-ui's Border Beam Button effect (the border-beam package,
// "sm" preset) in the warm "sunset" palette. Landing page only, and rare:
// the hero's "5 free" offer and the yearly saving. Never in the app.

export function BeamChip({ children, className }: { children: ReactNode; className?: string }) {
  const { theme } = useTheme();
  return (
    <BorderBeam
      size="sm"
      colorVariant="sunset"
      theme={theme === "dark" ? "dark" : "light"}
      borderRadius={999}
      duration={3.4}
      strength={0.8}
      className="inline-flex"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary text-foreground",
          className,
        )}
      >
        {children}
      </span>
    </BorderBeam>
  );
}
