import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Layers,
  Monitor,
  Plus,
  Smartphone,
  SlidersHorizontal,
  Square,
  Tablet,
} from "lucide-react";
import { SiReact, SiVuedotjs, SiHtml5, SiSwift, SiFlutter } from "react-icons/si";
import { cn } from "@/lib/utils";
import { compressImageDataUrl } from "@/lib/image-utils";
import { TECH_STACKS, DEVICES } from "@/lib/mock-data";
import { FLOW_MAX_SCREENS, FLOW_MIN_SCREENS } from "@/lib/pricing";
import type { FlowScreen } from "@/lib/flow-types";
import type { AnalysisMode } from "@/lib/session-types";
import type { DropdownOption } from "./OptionDropdownPill";
import {
  AttachmentTile,
  ComposerFrame,
  ComposerIconButton,
  ComposerMenu,
  MenuOption,
  SendButton,
} from "./composer-parts";

const DEVICE_ICONS = { monitor: Monitor, tablet: Tablet, smartphone: Smartphone };

// Brand logos per stack, not a generic "code" icon — react-css shares React's
// logo since it's still React underneath, just styled differently.
const STACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "react-tailwind": SiReact,
  "react-css": SiReact,
  vue: SiVuedotjs,
  "html-css": SiHtml5,
  swiftui: SiSwift,
  flutter: SiFlutter,
};

export const STACK_OPTIONS: DropdownOption[] = TECH_STACKS.map((s) => ({
  id: s.id,
  label: s.label,
  icon: STACK_ICONS[s.id],
}));

export const DEVICE_OPTIONS: DropdownOption[] = DEVICES.map((d) => ({
  id: d.id,
  label: d.label,
  icon: DEVICE_ICONS[d.icon as keyof typeof DEVICE_ICONS],
}));

// Example prompts cycled by the typewriter placeholder — stable module-level
// arrays so the effect below doesn't restart on every render.
const SINGLE_EXAMPLES = [
  "Check if my checkout flow is accessible",
  "Focus on mobile responsiveness",
  "Review the visual hierarchy and contrast",
];
const FLOW_EXAMPLES = [
  "User is trying to complete checkout",
  "New user completing onboarding",
  "User trying to find and buy a product",
];

function wait(ms: number, onTimeout: (id: number) => void): Promise<void> {
  return new Promise((resolve) => onTimeout(window.setTimeout(resolve, ms)));
}

// Types out each example, pauses, deletes it, and moves to the next — loops
// forever while `active`. Stops (and clears) as soon as the user has typed
// anything real, so it never fights with their own input.
function useTypewriterPlaceholder(examples: string[], active: boolean): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }
    let cancelled = false;
    let timeoutId = 0;
    const onTimeout = (id: number) => {
      timeoutId = id;
    };

    (async () => {
      let index = 0;
      while (!cancelled) {
        const full = examples[index % examples.length];
        for (let i = 1; i <= full.length && !cancelled; i++) {
          setText(full.slice(0, i));
          await wait(62, onTimeout);
        }
        await wait(1800, onTimeout);
        for (let i = full.length - 1; i >= 0 && !cancelled; i--) {
          setText(full.slice(0, i));
          await wait(32, onTimeout);
        }
        await wait(500, onTimeout);
        index++;
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [active, examples]);

  return text;
}

function renumber(screens: FlowScreen[]): FlowScreen[] {
  return screens.map((s, i) => ({ ...s, order: i }));
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface PromptComposerProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  attachments: FlowScreen[];
  onAttachmentsChange: (screens: FlowScreen[]) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  stack: string;
  onStackChange: (id: string) => void;
  device: string;
  onDeviceChange: (id: string) => void;
  onSubmit: () => void;
}

export function PromptComposer({
  mode,
  onModeChange,
  attachments,
  onAttachmentsChange,
  prompt,
  onPromptChange,
  stack,
  onStackChange,
  device,
  onDeviceChange,
  onSubmit,
}: PromptComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  const typewriterText = useTypewriterPlaceholder(
    mode === "single" ? SINGLE_EXAMPLES : FLOW_EXAMPLES,
    prompt.length === 0,
  );

  const max = mode === "single" ? 1 : FLOW_MAX_SCREENS;
  const min = mode === "single" ? 1 : FLOW_MIN_SCREENS;
  const canSubmit = attachments.length >= min;
  const atCap = attachments.length >= max;

  const addFiles = async (files: FileList | File[]) => {
    const room = mode === "single" ? 1 : max - attachments.length;
    if (room <= 0) {
      toast.error(`Flow analysis supports up to ${max} screens — remove one to add another.`);
      return;
    }

    const all = Array.from(files);
    const validType = all.filter((f) => f.type.startsWith("image/"));
    const validSize = validType.filter((f) => f.size <= 5 * 1024 * 1024);
    const accepted = validSize.slice(0, room);

    if (validType.length < all.length) {
      toast.error("Only PNG, JPG, and WEBP images are supported — some files were skipped.");
    } else if (validSize.length < validType.length) {
      toast.error("Some files were over the 5MB limit and were skipped.");
    } else if (accepted.length < validSize.length) {
      toast.error(
        `Only ${room} more screen${room === 1 ? "" : "s"} allowed (max ${max}) — the rest were skipped.`,
      );
    }

    const added: FlowScreen[] = [];
    for (const file of accepted) {
      const dataUrl = await readAsDataUrl(file);
      const compressed = await compressImageDataUrl(dataUrl);
      added.push({
        id: crypto.randomUUID(),
        order: 0,
        name: file.name,
        dataUrl: compressed,
        source: "upload",
      });
    }

    const next = mode === "single" ? added : [...attachments, ...added];
    onAttachmentsChange(renumber(next));
  };

  const remove = (id: string) => {
    onAttachmentsChange(renumber(attachments.filter((a) => a.id !== id)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= attachments.length) return;
    const next = [...attachments];
    [next[index], next[target]] = [next[target], next[index]];
    onAttachmentsChange(renumber(next));
  };

  const stackOpt = STACK_OPTIONS.find((o) => o.id === stack);
  const deviceOpt = DEVICE_OPTIONS.find((o) => o.id === device);
  const StackIcon = stackOpt?.icon;
  const DeviceIcon = deviceOpt?.icon;

  // Claude-style input (design-system/organisms/prompt-composer.md):
  // screenshots on top, the prompt, then one toolbar — attach + output
  // settings on the left, the analysis mode (where Claude puts its model
  // picker) and send on the right.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ComposerFrame onFiles={(f) => void addFiles(f)}>
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
            {attachments.map((screen, i) => (
              <AttachmentTile
                key={screen.id}
                src={screen.dataUrl}
                name={screen.name}
                order={mode === "flow" ? i + 1 : undefined}
                onRemove={() => remove(screen.id)}
                onMoveLeft={
                  mode === "flow" && attachments.length > 1 && i > 0 ? () => move(i, -1) : undefined
                }
                onMoveRight={
                  mode === "flow" && attachments.length > 1 && i < attachments.length - 1
                    ? () => move(i, 1)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Prompt. The placeholder is a typewriter overlay cycling example
            prompts (useTypewriterPlaceholder); it disappears the moment the
            user types. */}
        <div className="relative px-1.5">
          {prompt.length === 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-1.5 inset-y-0 overflow-hidden py-2 text-[15px] text-text-tertiary"
            >
              {typewriterText}
              <span className="animate-pulse-dot">|</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows={2}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            aria-label={mode === "single" ? "Specific focus for this analysis" : "Flow goal"}
            className="relative block max-h-[160px] min-h-[52px] w-full resize-none overflow-y-auto bg-transparent py-2 text-[15px] leading-[1.5] text-foreground focus:outline-none"
          />
        </div>

        {/* Toolbar */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <ComposerIconButton
            label={mode === "single" ? "Attach a screenshot" : "Attach screens"}
            disabled={mode === "flow" && atCap}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-4 w-4" />
          </ComposerIconButton>

          {/* Output settings: which stack the fix prompts target, which
              device the screenshot is from. */}
          <ComposerMenu
            width="w-[264px]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Output settings: ${stackOpt?.label}, ${deviceOpt?.label}`}
                title="Output settings"
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-[10px] border px-2 text-[13px] transition-colors",
                  open
                    ? "border-border-strong bg-bg-elevated text-foreground"
                    : "border-border text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden items-center gap-1.5 sm:flex">
                  {StackIcon && <StackIcon className="h-3.5 w-3.5" />}
                  {stackOpt?.label}
                  <span className="text-text-tertiary">·</span>
                  {DeviceIcon && <DeviceIcon className="h-3.5 w-3.5" />}
                  {deviceOpt?.label}
                </span>
              </button>
            )}
          >
            {() => (
              <div>
                <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-text-tertiary">
                  Fix prompts written for
                </p>
                {STACK_OPTIONS.map((o) => {
                  const Icon = o.icon;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={o.id === stack}
                      onClick={() => onStackChange(o.id)}
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-left text-[14px] text-foreground transition-colors hover:bg-bg-elevated"
                    >
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="flex-1">{o.label}</span>
                      {o.id === stack && <Check className="h-4 w-4 text-foreground" />}
                    </button>
                  );
                })}
                <div className="mx-1 my-1.5 border-t border-border" />
                <p className="px-2.5 pb-1.5 text-[12px] font-medium text-text-tertiary">
                  Screenshot is from
                </p>
                <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                  {DEVICE_OPTIONS.map((o) => {
                    const Icon = o.icon;
                    const on = o.id === device;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={on}
                        onClick={() => onDeviceChange(o.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-[10px] border py-2 text-[12px] transition-colors",
                          on
                            ? "border-border-strong bg-bg-elevated text-foreground"
                            : "border-transparent text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </ComposerMenu>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Analysis mode — sits where Claude puts its model picker */}
            <ComposerMenu
              align="right"
              width="w-[272px]"
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-[10px] px-2 text-[13px] font-medium transition-colors",
                    open
                      ? "bg-bg-elevated text-foreground"
                      : "text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
                  )}
                >
                  {mode === "single" ? "Single screen" : "Flow"}
                  {mode === "flow" && (
                    <span className="tabular-nums text-text-tertiary">
                      {attachments.length}/{FLOW_MAX_SCREENS}
                    </span>
                  )}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                  />
                </button>
              )}
            >
              {(close) => (
                <>
                  <MenuOption
                    selected={mode === "single"}
                    onSelect={() => {
                      onModeChange("single");
                      close();
                    }}
                    icon={<Square className="h-4 w-4" />}
                    title="Single screen"
                    description="One screenshot, every issue pinned and scored."
                    trailing={mode === "single" && <Check className="mt-0.5 h-4 w-4" />}
                  />
                  <MenuOption
                    selected={mode === "flow"}
                    onSelect={() => {
                      onModeChange("flow");
                      close();
                    }}
                    icon={<Layers className="h-4 w-4" />}
                    title="Flow"
                    description={`${FLOW_MIN_SCREENS}–${FLOW_MAX_SCREENS} screens in order. Catches issues between steps.`}
                    trailing={mode === "flow" && <Check className="mt-0.5 h-4 w-4" />}
                  />
                </>
              )}
            </ComposerMenu>

            <SendButton
              label={mode === "single" ? "Analyze UX" : "Analyze flow"}
              disabled={!canSubmit}
              onClick={onSubmit}
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple={mode === "flow"}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </ComposerFrame>

      {mode === "flow" && attachments.length > 0 && attachments.length < FLOW_MIN_SCREENS && (
        <p className="mt-2 px-1 text-[12px] text-text-tertiary">
          Add {FLOW_MIN_SCREENS - attachments.length} more screen to analyze the flow.
        </p>
      )}
    </motion.div>
  );
}
