import { useId, useState, type ReactNode, type InputHTMLAttributes } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

// The account modals' shared parts: sign in / sign up, add credits, and the
// out-of-credits plans. Adapted from cult-ui's Halo set (halo-input,
// halo-field, halo-segmented, halo-badge) to our design system: the same
// recessed field with an inset rim, a sliding segmented thumb and quiet pill
// chips, but greys first. No rainbow glow; orange only for focus, the one
// primary button and errors. See design-system/organisms/modal-shell.md.

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Dialog shell ────────────────────────────────────────────────────────────

/**
 * Radix Dialog (focus trap, Esc, aria-modal, scroll lock) animated with
 * framer-motion. One shell for every account modal.
 */
export function AccountDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  data-ui-icons
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className={cn(
                    "pointer-events-auto relative w-full max-w-md rounded-[24px] border border-border bg-bg-tertiary p-6 text-foreground shadow-elegant outline-none sm:p-7",
                    // A lit top edge, as on the cult-ui surfaces.
                    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_var(--surface-highlight)] before:content-['']",
                    className,
                  )}
                >
                  <Dialog.Close
                    aria-label="Close"
                    className="absolute right-4 top-4 grid h-8 w-8 place-items-center text-text-tertiary transition-colors duration-200 hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ borderRadius: "12px" }}
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                  <div className="pr-10">
                    <Dialog.Title className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1.5 text-[14px] leading-relaxed text-text-tertiary">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  {children}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ─── Text field ──────────────────────────────────────────────────────────────

/**
 * Label + a recessed input (halo-input's shell: a 12px rim with an inset
 * shadow, one surface step below the modal). Passwords get a show/hide eye.
 */
export function TextField({
  label,
  hint,
  icon,
  trailing,
  type = "text",
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  /** Small text right of the label ("Min. 8 characters"). */
  hint?: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground">
          {label}
        </label>
        {hint && <span className="text-[12px] text-text-tertiary">{hint}</span>}
      </div>
      <div
        className={cn(
          "flex h-11 items-center gap-2.5 border border-border bg-bg-secondary px-3.5 text-text-tertiary",
          "shadow-[inset_0_1px_2px_rgba(15,17,20,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
          "transition-[border-color,box-shadow] duration-200",
          "hover:border-border-strong focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_14%,transparent)]",
          "has-[input:disabled]:opacity-60",
        )}
        style={{ borderRadius: "12px" }}
      >
        {icon && <span className="flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-text-tertiary/70 focus:outline-none disabled:cursor-not-allowed"
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors hover:text-foreground"
          >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : (
          trailing && <span className="flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{trailing}</span>
        )}
      </div>
    </div>
  );
}

// ─── Segmented control ───────────────────────────────────────────────────────

/** halo-segmented: a recessed track and a raised thumb that springs across. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const group = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex rounded-full border border-border bg-bg-secondary p-1 shadow-[inset_0_1px_2px_rgba(15,17,20,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative h-8 flex-1 rounded-full text-[13.5px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "text-foreground" : "text-text-tertiary hover:text-foreground",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {on && (
              <motion.span
                layoutId={`seg-thumb-${group}`}
                className="absolute inset-0 rounded-full border border-border/80 bg-bg-tertiary shadow-[inset_0_1px_0_var(--surface-highlight),0_1px_3px_rgba(15,17,20,0.08)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)]"
                transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
              />
            )}
            <span className="relative">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────

/** halo-badge, greys first: a quiet pill; `solid` for the one that matters. */
export function Chip({
  children,
  tone = "quiet",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: "quiet" | "solid";
  /** A leading status dot (orange), e.g. "5 free critiques". */
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium leading-none",
        tone === "solid"
          ? "bg-foreground text-background"
          : "border border-border bg-bg-secondary text-muted-foreground",
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
}

// ─── Choice card ─────────────────────────────────────────────────────────────

/**
 * A selectable option (a credit pack, a plan): 1px border, a filled check
 * when chosen, a raised surface while selected. Works as a radio.
 */
export function ChoiceCard({
  selected,
  onSelect,
  children,
  className,
  indicator = "end",
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  /** Where the check sits: end of a row, or the top-right corner of a tile. */
  indicator?: "end" | "corner";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3 border text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-foreground/70 bg-bg-tertiary shadow-[0_0_0_3px_color-mix(in_srgb,var(--foreground)_7%,transparent)]"
          : "border-border bg-bg-secondary hover:border-border-strong hover:bg-bg-tertiary",
        className,
      )}
      style={{ borderRadius: "16px" }}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-200",
          indicator === "corner" ? "absolute right-2.5 top-2.5 h-[18px] w-[18px]" : "ml-auto",
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-border-strong bg-bg-tertiary",
        )}
      >
        <Check
          className={cn("h-3 w-3 transition-opacity", selected ? "opacity-100" : "opacity-0")}
          strokeWidth={2.5}
        />
      </span>
    </button>
  );
}

// ─── Notice, divider ─────────────────────────────────────────────────────────

/** Inline error/notice under a form. Orange is the system's error colour. */
export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[12px] border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[13px] leading-snug text-primary"
    >
      {children}
    </motion.p>
  );
}

export function OrDivider({ children = "or" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-text-tertiary">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Google ──────────────────────────────────────────────────────────────────

/** Google's "G" in its own colours, as Google's sign-in branding requires. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/** "Continue with Google": a full-width outline button, the first option. */
export function GoogleButton({
  onClick,
  loading,
  disabled,
  children = "Continue with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 border border-border bg-bg-tertiary text-[14px] font-medium text-foreground shadow-[inset_0_1px_0_var(--surface-highlight),0_1px_2px_rgba(15,17,20,0.05)] transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      style={{ borderRadius: "12px" }}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
      ) : (
        <GoogleG className="h-[18px] w-[18px]" />
      )}
      {loading ? "Connecting to Google…" : children}
    </button>
  );
}
