import { motion } from "framer-motion";
import { Upload, ImageIcon, X, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { compressImageDataUrl } from "@/lib/image-utils";
import { FLOW_MAX_SCREENS, FLOW_MIN_SCREENS } from "@/lib/pricing";
import type { FlowScreen } from "@/lib/flow-types";

interface FlowUploadZoneProps {
  screens: FlowScreen[];
  onChange: (screens: FlowScreen[]) => void;
}

function renumber(screens: FlowScreen[]): FlowScreen[] {
  return screens.map((s, i) => ({ ...s, order: i }));
}

export function FlowUploadZone({ screens, onChange }: FlowUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const room = FLOW_MAX_SCREENS - screens.length;
      if (room <= 0) return;

      const accepted = Array.from(files)
        .filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024)
        .slice(0, room);

      const newScreens: FlowScreen[] = [];
      for (const file of accepted) {
        const dataUrl = await readAsDataUrl(file);
        const compressed = await compressImageDataUrl(dataUrl);
        newScreens.push({
          id: crypto.randomUUID(),
          order: 0, // fixed by renumber below
          name: file.name,
          dataUrl: compressed,
          source: "upload",
        });
      }

      onChange(renumber([...screens, ...newScreens]));
    },
    [screens, onChange],
  );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= screens.length) return;
    const next = [...screens];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(renumber(next));
  };

  const remove = (index: number) => {
    onChange(renumber(screens.filter((_, i) => i !== index)));
  };

  const atCap = screens.length >= FLOW_MAX_SCREENS;

  return (
    <div className="space-y-2">
      {screens.map((screen, i) => (
        <motion.div
          key={screen.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-border-strong bg-bg-tertiary p-2.5"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-bg-elevated text-[12px] font-semibold text-foreground">
            {i + 1}
          </span>
          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
            <img
              src={screen.dataUrl}
              alt={screen.name}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-foreground" />
            <span className="truncate">{screen.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-bg-elevated hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === screens.length - 1}
              aria-label="Move down"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-bg-elevated hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => remove(i)}
              aria-label="Remove screen"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-bg-elevated hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ))}

      {!atCap && (
        <label
          htmlFor="flow-upload-input"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm font-medium transition-colors duration-150",
            "border-border-strong bg-bg-tertiary/50 text-muted-foreground hover:border-text-tertiary hover:bg-bg-tertiary hover:text-foreground",
          )}
        >
          {screens.length === 0 ? <Upload className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {screens.length === 0
            ? "Drop screens in order, or click to upload"
            : `Add another screen (${screens.length}/${FLOW_MAX_SCREENS})`}
          <input
            ref={inputRef}
            id="flow-upload-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {screens.length > 0 && screens.length < FLOW_MIN_SCREENS && (
        <p className="px-1 text-[12px] text-text-tertiary">
          Add at least {FLOW_MIN_SCREENS} screens to analyze a flow.
        </p>
      )}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
