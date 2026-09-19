import { motion } from "framer-motion";
import { Upload, ImageIcon, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFile: (file: File, dataUrl: string) => void;
  preview?: { name: string; dataUrl: string } | null;
  onClear?: () => void;
}

export function UploadZone({ onFile, preview, onClear }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => onFile(file, reader.result as string);
      reader.readAsDataURL(file);
    },
    [onFile],
  );

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-strong bg-bg-tertiary p-3"
      >
        <div className="relative flex-1 overflow-hidden rounded-xl bg-bg-secondary">
          <img src={preview.dataUrl} alt={preview.name} className="h-full w-full object-contain" />
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[200px]">{preview.name}</span>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              aria-label="Remove image"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-bg-elevated hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.label
      htmlFor="upload-input"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      whileHover={{ scale: 1.005 }}
      className={cn(
        "group relative block cursor-pointer overflow-hidden rounded-2xl",
        "border border-dashed transition-all duration-300",
        "bg-bg-tertiary/50 backdrop-blur",
        dragging
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-border-strong hover:border-primary/60 hover:bg-bg-tertiary",
      )}
    >
      {/* Animated border glow on hover */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "var(--gradient-primary)",
          maskImage: "linear-gradient(black,black)",
          filter: "blur(20px)",
          opacity: 0.15,
        }}
      />

      <input
        ref={inputRef}
        id="upload-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className="relative flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          animate={dragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow"
        >
          <Upload className="h-6 w-6 text-white" strokeWidth={2.5} />
        </motion.div>
        <h3 className="text-base font-semibold text-foreground">
          {dragging ? "Drop it like it's hot" : "Drop a screenshot or click to upload"}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">PNG · JPG · WEBP — up to 5MB</p>
      </div>
    </motion.label>
  );
}
