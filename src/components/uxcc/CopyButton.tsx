import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowButton } from "./GlowButton";

// The one copy control: the copy icon before the label, swapping to a check
// and "Copied" for 2s after a copy. Used for every fix prompt, in the chat and
// in the analysis, and it looks the same everywhere: the primary (cosmic)
// button, because copying the prompt is the product's main action.
// See design-system/atoms/copy-button.md.

interface CopyButtonProps {
  text: string;
  label: string;
  className?: string;
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const Icon = copied ? Check : Copy;
  return (
    <GlowButton
      variant="primary"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
      className={cn("whitespace-nowrap", className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </GlowButton>
  );
}
