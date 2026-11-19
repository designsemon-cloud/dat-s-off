import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";

export interface DropdownOption {
  id: string;
  label: string;
  /** Rendered before the option's label, and — for the selected option —
   * before the value text on the trigger itself. Optional: Stack options
   * carry a brand logo, Device options carry a device-type icon; a future
   * option list with no natural icon can simply omit it. */
  icon?: React.ComponentType<{ className?: string }>;
}

interface OptionDropdownPillProps {
  label: string;
  selectedId: string;
  options: DropdownOption[];
  onChange: (id: string) => void;
}

export function OptionDropdownPill({
  label,
  selectedId,
  options,
  onChange,
}: OptionDropdownPillProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === selectedId);
  const SelectedIcon = selected?.icon;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <GlowButton
        type="button"
        variant="outline"
        size="sm"
        active={open}
        onClick={() => setOpen((o) => !o)}
        className="gap-1.5"
      >
        <span className="text-muted-foreground">{label}:</span>
        {SelectedIcon && <SelectedIcon className="h-3.5 w-3.5" />}
        <span>{selected?.label ?? selectedId}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </GlowButton>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-bg-elevated py-1 shadow-elegant"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] transition-colors",
                  isSelected
                    ? "font-semibold text-foreground"
                    : "text-foreground hover:bg-bg-tertiary",
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                <span className="flex-1">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
