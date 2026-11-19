import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// The landing page's two button components, one API (see
// design-system/atoms/cosmic-button.md):
//
//   CosmicButton — primary. Adapted from cult-ui's Cosmic Button
//   (https://www.cult-ui.com/docs/components/cosmic-button): a raised
//   neutral button inside an orange ring. At rest the ring keeps its width
//   and only its colour moves (a soft lighter band drifting through close
//   orange shades); on hover it grows 2px outward, as in the original.
//   The drift stops under reduced motion (styles.css).
//
//   SolidButton — secondary. Filled with the text colour: black in light
//   mode, white in dark. Same sizes and radii as CosmicButton so rows align.
//
// Both render an <a> (href), a router <Link> (to), or a <button> (as="button").

type Size = "sm" | "md";

/**
 * The cosmic look, shared with the app's primary buttons (GlowButton's
 * primary variant, the composer's send button), so there's one primary style.
 * The parent needs `group/cosmic relative` and padding the ring shows through.
 */
// The orange ring: only its colour drifts at rest; on hover it grows 2px and brightens.
export const COSMIC_RING =
  "cosmic-border absolute inset-0 transition-[inset,border-radius,filter] duration-500 ease-out group-hover/cosmic:inset-[-2px] group-hover/cosmic:brightness-110";
// The raised neutral surface inside it.
export const COSMIC_SURFACE = cn(
  "relative z-10 bg-bg-tertiary text-foreground",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(15,23,42,0.08),0_1px_1px_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.12)]",
  "transition-[box-shadow,transform] duration-300 group-hover/cosmic:shadow-[inset_0_1px_0_rgba(255,255,255,0.82),inset_0_-1px_0_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.14),0_12px_30px_rgba(15,23,42,0.16)] group-active/cosmic:scale-[0.98]",
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,0.45),0_10px_28px_rgba(0,0,0,0.35)]",
);
export const COSMIC_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Base = { size?: Size; className?: string; innerClassName?: string; children?: ReactNode };

export type ActionButtonProps =
  | (Base & { as?: "a" } & Omit<ComponentPropsWithoutRef<"a">, "className" | "children">)
  | (Base & { as: "button" } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">)
  | (Base & { as: "link"; to: string; params?: Record<string, string> });

const OUTER = {
  sm: "rounded-[11px] p-[2px]",
  md: "rounded-[15px] p-[3px]",
} as const;
// The ring sits behind the inner surface. At rest it shows exactly the
// padding (2px / 3px); on hover it grows 2px outward, as in the original
// cult-ui button. Width only changes on hover, never on its own.
const RING = {
  sm: "rounded-[11px] group-hover/cosmic:rounded-[13px]",
  md: "rounded-[15px] group-hover/cosmic:rounded-[17px]",
} as const;
const INNER = {
  sm: "h-8 rounded-[9px] px-3.5 text-[14px] font-medium",
  md: "h-11 rounded-[12px] px-6 text-[15px] font-semibold",
} as const;
const SOLID = {
  sm: "h-9 rounded-[11px] px-4 text-[14px] font-medium",
  md: "h-[50px] rounded-[15px] px-6 text-[15px] font-semibold",
} as const;

/** Renders the right element for `as` and passes everything else through. */
function Polymorphic({
  props,
  className,
  children,
}: {
  props: ActionButtonProps;
  className: string;
  children: ReactNode;
}) {
  if (props.as === "button") {
    const { as: _a, size: _s, className: _c, innerClassName: _i, children: _ch, ...rest } = props;
    return (
      <button type="button" className={className} {...rest}>
        {children}
      </button>
    );
  }
  if (props.as === "link") {
    return (
      <Link to={props.to as never} params={props.params as never} className={className}>
        {children}
      </Link>
    );
  }
  const { as: _a, size: _s, className: _c, innerClassName: _i, children: _ch, ...rest } = props;
  return (
    <a className={className} {...rest}>
      {children}
    </a>
  );
}

export function CosmicButton(props: ActionButtonProps) {
  const size = props.size ?? "md";
  return (
    <Polymorphic
      props={props}
      className={cn(
        "group/cosmic relative inline-flex items-center justify-center",
        COSMIC_FOCUS,
        OUTER[size],
        props.className,
      )}
    >
      {/* Orange ring. At rest only its colour moves: a soft lighter band
          drifting along close shades (styles.css → .cosmic-border). On hover
          it grows 2px and the light band brightens a touch. */}
      <span aria-hidden className={cn(COSMIC_RING, RING[size])} />
      {/* Raised inner surface */}
      <span
        className={cn(
          "flex w-full items-center justify-center gap-2",
          COSMIC_SURFACE,
          INNER[size],
          props.innerClassName,
        )}
      >
        {props.children}
      </span>
    </Polymorphic>
  );
}

export function SolidButton(props: ActionButtonProps) {
  const size = props.size ?? "md";
  return (
    <Polymorphic
      props={props}
      className={cn(
        "group inline-flex items-center justify-center gap-2 bg-foreground text-background active:scale-[0.98]",
        // Same hover language as CosmicButton: a ring grows out of the
        // edge (3px, its own colour at 18%), 0.5s ease-out.
        "shadow-[0_0_0_0_color-mix(in_oklab,var(--foreground)_18%,transparent),0_1px_2px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-500 ease-out hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--foreground)_18%,transparent),0_1px_2px_rgba(15,23,42,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        SOLID[size],
        props.className,
      )}
    >
      {props.children}
    </Polymorphic>
  );
}
