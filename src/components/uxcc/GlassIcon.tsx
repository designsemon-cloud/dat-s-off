import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small app-icon tile of clear liquid glass with a chromatic rim, holding
 * one lucide icon (styles.css → .glass-icon). Decorative: the label beside
 * it carries the meaning. See design-system/atoms/glass-icon.md.
 */
export function GlassIcon({
  icon: Icon,
  size = 28,
  round = false,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  /** A circle (the FAB) instead of the app-icon squircle. */
  round?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("glass-icon shrink-0", round && "glass-icon-round", className)}
      style={{ width: size, height: size }}
    >
      <Icon
        className="relative"
        style={{ width: size * 0.44, height: size * 0.44 }}
        strokeWidth={2}
      />
    </span>
  );
}
