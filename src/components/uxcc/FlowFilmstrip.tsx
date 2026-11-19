import { cn } from "@/lib/utils";
import type { FlowScreen } from "@/lib/flow-types";

interface FlowFilmstripProps {
  screens: FlowScreen[];
  activeScreenId?: string | null;
  onSelect?: (screenId: string | null) => void;
  scores?: Record<string, number>;
}

export function FlowFilmstrip({ screens, activeScreenId, onSelect, scores }: FlowFilmstripProps) {
  const ordered = [...screens].sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ordered.map((screen, i) => {
        const active = activeScreenId === screen.id;
        return (
          <button
            key={screen.id}
            onClick={() => onSelect?.(active ? null : screen.id)}
            className={cn(
              "group relative flex shrink-0 flex-col overflow-hidden rounded-xl border bg-bg-tertiary transition-colors",
              active ? "border-primary shadow-sm" : "border-border hover:border-border-strong",
            )}
            style={{ width: 128 }}
          >
            <div className="h-20 w-full overflow-hidden bg-bg-secondary">
              <img
                src={screen.dataUrl}
                alt={screen.name}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[12px] font-medium text-foreground">Screen {i + 1}</span>
              {scores?.[screen.id] !== undefined && (
                <span className="text-[10px] font-mono text-text-tertiary">
                  {scores[screen.id]}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
