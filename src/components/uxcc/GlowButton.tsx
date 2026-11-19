import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { COSMIC_FOCUS, COSMIC_RING, COSMIC_SURFACE } from "@/components/ui/cosmic-button";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  /**
   * Sticks the variant's hover/open look permanently — used for toggleable
   * controls built on GlowButton (a segmented-control segment that's
   * selected, a dropdown trigger that's open) rather than just a hover state.
   */
  active?: boolean;
}

/**
 * Compact, dense button. Reference-style: slim, low padding, clear affordance.
 *
 * This is the one component every compact interactive pill in the app is
 * built from — GlowButton itself, segmented-control segments (ghost variant
 * + active), and option-dropdown-pill triggers (outline variant + active) —
 * so the 12px radius and hover/active treatment never drift between them.
 */
export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, variant = "primary", size = "md", active = false, ...props }, ref) => {
    const sizes = {
      sm: "h-8 px-3 text-[14px]",
      md: "h-8 px-3 text-[14px]",
      lg: "h-9 px-4 text-sm",
    };
    const radius = { borderRadius: "12px" };

    if (variant === "ghost") {
      return (
        <button
          ref={ref}
          style={radius}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 font-medium",
            "transition-colors duration-150",
            active
              ? "bg-bg-elevated text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-bg-elevated",
            sizes[size],
            className,
          )}
          {...props}
        >
          {children}
        </button>
      );
    }

    if (variant === "outline") {
      return (
        <button
          ref={ref}
          style={radius}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 font-medium border",
            "transition-colors duration-150",
            active
              ? "border-border-strong bg-bg-elevated text-foreground"
              : "border-border bg-bg-tertiary text-foreground shadow-sm hover:border-border-strong hover:bg-bg-elevated",
            sizes[size],
            className,
          )}
          {...props}
        >
          {children}
        </button>
      );
    }

    // Primary: the product's one primary button, the cosmic button
    // (components/ui/cosmic-button.tsx): a raised neutral surface inside a
    // slowly drifting orange ring. Same outer height as the other variants.
    const inner = {
      sm: "h-7 px-3 text-[14px]",
      md: "h-7 px-3 text-[14px]",
      lg: "h-8 px-4 text-sm",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "group/cosmic relative inline-flex rounded-[12px] p-[2px]",
          COSMIC_FOCUS,
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(COSMIC_RING, "rounded-[12px] group-hover/cosmic:rounded-[14px]")}
        />
        <span
          className={cn(
            "flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-medium",
            COSMIC_SURFACE,
            inner[size],
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
GlowButton.displayName = "GlowButton";
