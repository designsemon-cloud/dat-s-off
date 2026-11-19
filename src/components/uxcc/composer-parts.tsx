import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COSMIC_FOCUS, COSMIC_RING, COSMIC_SURFACE } from "@/components/ui/cosmic-button";

// Building blocks of the Claude-style input (see
// design-system/organisms/prompt-composer.md). PromptComposer (new critique)
// and ChatPane's follow-up box are both assembled from these, so every
// text input in the product looks and behaves the same.

/**
 * The input shell: a roomy 20px-radius box with a soft shadow that deepens
 * on hover / focus, and a dashed drop overlay while files are dragged over.
 */
export function ComposerFrame({
  onFiles,
  disabled = false,
  dropLabel = "Drop screenshots to attach",
  className,
  children,
}: {
  onFiles?: (files: FileList) => void;
  disabled?: boolean;
  dropLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!onFiles || disabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!onFiles || disabled) return;
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative rounded-[20px] border border-border bg-bg-tertiary p-3",
        "shadow-[0_4px_20px_rgba(15,17,20,0.05)] transition-[border-color,box-shadow] duration-200",
        "hover:border-border-strong focus-within:border-border-strong focus-within:shadow-[0_6px_28px_rgba(15,17,20,0.09)]",
        "dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] dark:focus-within:shadow-[0_6px_28px_rgba(0,0,0,0.5)]",
        disabled && "opacity-60",
        className,
      )}
    >
      {children}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute inset-1.5 z-30 grid place-items-center rounded-[15px] border-2 border-dashed border-border-strong bg-bg-tertiary/95"
          >
            <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
              <ImagePlus className="h-4 w-4 text-text-tertiary" /> {dropLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Screenshot preview tile: remove on hover (always on touch); flow order + reorder. */
export function AttachmentTile({
  src,
  name,
  order,
  size = "md",
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  src: string;
  name: string;
  order?: number;
  size?: "sm" | "md";
  onRemove: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={cn("group relative shrink-0", size === "md" ? "h-[72px] w-[72px]" : "h-12 w-12")}
    >
      <div className="h-full w-full overflow-hidden rounded-[12px] border border-border bg-bg-secondary">
        <img src={src} alt={name} className="h-full w-full object-cover object-top" />
      </div>
      {order !== undefined && (
        <span className="absolute bottom-1 left-1 grid h-4 min-w-4 place-items-center rounded-md bg-black/65 px-1 text-[10px] font-semibold text-white">
          {order}
        </span>
      )}
      {(onMoveLeft || onMoveRight) && (
        <div className="absolute bottom-1 right-1 hidden gap-0.5 group-hover:flex">
          {[
            { fn: onMoveLeft, Icon: ChevronLeft, label: "Move earlier" },
            { fn: onMoveRight, Icon: ChevronRight, label: "Move later" },
          ].map(({ fn, Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              disabled={!fn}
              aria-label={label}
              className="grid h-4 w-4 place-items-center rounded bg-black/65 text-white disabled:opacity-30"
            >
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-bg-tertiary text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/** Square toolbar button (attach, tools). `active` tints it like a toggled tool. */
export function ComposerIconButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-border-strong bg-bg-elevated text-foreground"
          : "border-border text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** The send button: the primary (cosmic) button as a square, arrow up. */
export function SendButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "group/cosmic relative grid h-8 w-8 shrink-0 rounded-[11px] p-[2px]",
        COSMIC_FOCUS,
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <span
        aria-hidden
        className={cn(COSMIC_RING, "rounded-[11px] group-hover/cosmic:rounded-[13px]")}
      />
      <span className={cn("grid h-7 w-7 place-items-center rounded-[9px]", COSMIC_SURFACE)}>
        <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </button>
  );
}

/**
 * A toolbar popover (tools menu, mode picker). Opens up or down, closes on
 * outside click / Escape.
 */
export function ComposerMenu({
  trigger,
  placement = "down",
  align = "left",
  width = "w-64",
  children,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  placement?: "up" | "down";
  align?: "left" | "right";
  width?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: placement === "down" ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "down" ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-40 overflow-hidden rounded-xl border border-border bg-bg-tertiary p-1 text-left shadow-elegant",
              placement === "down" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]",
              align === "left" ? "left-0" : "right-0",
              width,
            )}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One selectable row inside a ComposerMenu. */
export function MenuOption({
  selected,
  onSelect,
  icon,
  title,
  description,
  trailing,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-bg-elevated",
        selected && "bg-bg-elevated/60",
      )}
    >
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-foreground">{title}</span>
        {description && (
          <span className="block text-[12px] leading-snug text-text-tertiary">{description}</span>
        )}
      </span>
      {trailing}
    </button>
  );
}
