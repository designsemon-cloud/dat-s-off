import { motion, type Transition } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Height reveal for expanding sections (accordions, "tell us more" forms).
// The content is clipped only while it animates; once open, overflow is
// visible, so focus rings, hover rings and button shadows inside aren't cut
// into a hard edge. Use it inside <AnimatePresence>.
//
// It's a component, not a spread of variants: framer resolves
// `height: "auto"` with its own transitionEnd, which drops a
// `transitionEnd: { overflow }` of ours, so the clip would stay on.
// See design-system/atoms/cosmic-button.md#clipping.
export function Reveal({
  transition,
  className,
  children,
}: {
  transition?: Transition;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // Mounted already open (AnimatePresence initial={false}): no animation
  // runs, so nothing would ever unclip it. Framer only writes height: 0 when
  // it's about to animate in.
  useLayoutEffect(() => {
    if (ref.current && ref.current.style.height !== "0px") setOpen(true);
  }, []);
  return (
    <motion.div
      ref={ref}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={transition}
      onAnimationStart={() => setOpen(false)}
      onAnimationComplete={(def) =>
        setOpen(typeof def === "object" && def !== null && "height" in def && def.height === "auto")
      }
      style={{ overflow: open ? "visible" : "hidden" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
