import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Tablet, Smartphone, Code2, MessageSquare } from "lucide-react";
import { TECH_STACKS, DEVICES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const DEVICE_ICONS = { monitor: Monitor, tablet: Tablet, smartphone: Smartphone };

interface ConfigPanelProps {
  stack: string;
  device: string;
  onStackChange: (id: string) => void;
  onDeviceChange: (id: string) => void;
}

export function ConfigPanel({ stack, device, onStackChange, onDeviceChange }: ConfigPanelProps) {
  const [notes, setNotes] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Tech Stack */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Code2 className="h-3.5 w-3.5" />
          Tech Stack
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TECH_STACKS.map((s) => (
            <button
              key={s.id}
              onClick={() => onStackChange(s.id)}
              style={{ borderRadius: "4px" }}
              className={cn(
                "h-8 border px-3 text-[13px] font-medium transition-colors duration-150",
                stack === s.id
                  ? "border-border-strong bg-bg-elevated text-foreground"
                  : "border-border bg-bg-tertiary/60 text-muted-foreground hover:border-border-strong hover:bg-bg-elevated hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Device */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Monitor className="h-3.5 w-3.5" />
          Target Device
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEVICES.map((d) => {
            const Icon = DEVICE_ICONS[d.icon as keyof typeof DEVICE_ICONS];
            return (
              <button
                key={d.id}
                onClick={() => onDeviceChange(d.id)}
                style={{ borderRadius: "4px" }}
                className={cn(
                  "flex flex-col items-center gap-1 border px-2 py-2 transition-colors duration-150",
                  device === d.id
                    ? "border-border-strong bg-bg-elevated text-foreground"
                    : "border-border bg-bg-tertiary/60 text-muted-foreground hover:border-border-strong hover:bg-bg-elevated hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[12px] font-medium">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications — optional */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <MessageSquare className="h-3.5 w-3.5" />
          Specifications
          <span className="ml-auto text-[10px] normal-case tracking-normal text-text-tertiary/50">
            optional
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Font size, accessibility requirements, focus areas…"
          rows={3}
          style={{ borderRadius: "4px" }}
          className="w-full resize-none border border-border bg-bg-tertiary/60 px-3 py-2 text-[13px] text-foreground placeholder:text-text-tertiary/60 focus:border-border-strong focus:outline-none transition-colors duration-150"
        />
      </div>
    </motion.div>
  );
}
