import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

/**
 * Compact, dense button. Reference-style: slim, low padding, clear affordance.
 */
export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, variant = "primary", size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-8 px-3 text-[13px]",
      md: "h-8 px-3 text-[13px]",
      lg: "h-9 px-4 text-sm",
    };
    const radius = { borderRadius: "4px" };

    if (variant === "ghost") {
      return (
        <button
          ref={ref}
          style={radius}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-bg-elevated",
            "transition-colors duration-150",
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
            "inline-flex items-center justify-center gap-1.5 font-medium",
            "border border-border bg-bg-tertiary/60 text-foreground",
            "hover:border-border-strong hover:bg-bg-elevated",
            "transition-colors duration-150",
            sizes[size],
            className,
          )}
          {...props}
        >
          {children}
        </button>
      );
    }

    return (
      <button
        ref={ref}
        style={radius}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium",
          "bg-primary text-primary-foreground",
          "hover:bg-primary-glow active:opacity-90",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
GlowButton.displayName = "GlowButton";
