import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Play, Wrench, X } from "lucide-react";
import {
  TOPICS,
  embedUrl,
  previewImage,
  resourceMeta,
  videoLength,
  youtubeId,
  type CatalogItem,
} from "@/lib/learn";
import { cn } from "@/lib/utils";

// The shared pieces of "learn the why" (design-system/patterns/learning.md),
// used by the critique's Keep learning shelf and the landing page's library:
//   ResourceCard   a cutout card (after cult-ui's Cutout Card): the image eases
//                  up on hover, a notched label is cut into its corner, and a
//                  "Play here" / "Read" pin fades in. Videos play in place,
//                  articles open in a new tab.
//   Marquee        an auto-scrolling row that stops on hover, focus, or off
//                  screen, and holds still under reduced motion
//   Rail           a horizontal, snapping carousel with arrow buttons
//   VideoLightbox  the in-place YouTube player (privacy-enhanced embed)

const EASE = [0.22, 1, 0.36, 1] as const;

/** cult-ui's concave corner: the solid sits bottom-left once mirrored. */
function Corner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute h-3.5 w-3.5 -scale-x-100", className)}
    >
      <path d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z" fill="currentColor" />
    </svg>
  );
}

/** One video or article, as a cutout card. */
export function ResourceCard({
  item,
  onPlay,
  context = "library",
  className,
}: {
  item: CatalogItem;
  /**
   * library: the second line says what it teaches (the principle, or its
   * topic when the title already names it). shelf: it already sits under its
   * principle, so it says what it is (Video, Article…).
   */
  context?: "library" | "shelf";
  /** Plays a video in place; without it, videos open on YouTube. */
  onPlay?: (item: CatalogItem) => void;
  className?: string;
}) {
  const r = item.resource;
  const img = previewImage(r);
  const video = youtubeId(r) !== null;
  const plays = video && !!onPlay;
  // On the landing page the cards wear the same paper as every other landing
  // card (surface colour + grain). In the app they stay plain, as the
  // design system keeps grain off the product.
  const paper = context === "library";
  const face = paper ? "bg-[var(--surface-card)]" : "bg-card";
  const p = item.principle;
  const about =
    context === "shelf"
      ? video
        ? "Video"
        : r.kind === "tool"
          ? "Tool"
          : r.minutes
            ? "Article"
            : "Reference"
      : r.title.toLowerCase().includes(p.name.toLowerCase().replace(/'s law$/, ""))
        ? (TOPICS.find((t) => t.id === p.topic)?.label ?? p.name)
        : p.name;
  const Kind = video ? Play : r.kind === "tool" ? Wrench : BookOpen;

  const body = (
    <span
      // Flat: a hairline edge, no drop shadow. Hover lifts the card and firms
      // up the edge instead.
      className={cn(
        "relative block overflow-hidden rounded-[22px] border border-border/80 transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-learn dark:border-border/60",
        face,
        paper && "bg-grain card-grain",
      )}
    >
      {/* Media */}
      <span className="relative block aspect-video overflow-hidden bg-bg-elevated">
        {img ? (
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
          />
        ) : (
          <DrawnTile item={item} />
        )}
        {img && (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        )}
        {video && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/30 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-learn group-hover:text-background group-hover:ring-learn/40">
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )}
        {/* Pin: what a click does, revealed on hover. */}
        <span className="absolute right-3 top-3 inline-flex translate-y-1 items-center gap-1 rounded-full bg-learn px-2.5 py-1 text-[11.5px] font-medium text-background opacity-0 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {plays ? (
            "Play here"
          ) : (
            <>
              {video ? "Watch on YouTube" : "Read"}
              <ArrowUpRight className="h-3 w-3" />
            </>
          )}
        </span>
        {/* Notched label cut into the image's corner. */}
        <span
          className={cn(
            "absolute bottom-0 left-0 isolate inline-flex items-center gap-1.5 rounded-tr-[14px] py-1.5 pl-4 pr-3 text-[11.5px] font-medium tabular-nums text-muted-foreground",
            face,
          )}
        >
          {/* The notch is cut from the same paper as the card below it. */}
          {paper && <span aria-hidden className="card-grain-layer" />}
          <Corner
            className={cn("-top-3.5 left-0", paper ? "text-[var(--surface-card)]" : "text-card")}
          />
          <Corner
            className={cn(
              "-right-3.5 bottom-0",
              paper ? "text-[var(--surface-card)]" : "text-card",
            )}
          />
          <Kind
            className="h-3 w-3"
            {...(video ? { fill: "currentColor", strokeWidth: 0 } : { strokeWidth: 2 })}
          />
          {videoLength(r) ?? resourceMeta(r)}
        </span>
      </span>
      {/* Text */}
      <span className="block px-4 pb-4 pt-2">
        {/* The title turns to the learn accent on hover: it's a link. */}
        <span className="line-clamp-2 block min-h-[2.6em] text-[14.5px] font-medium leading-[1.3] text-foreground transition-colors duration-300 group-hover:text-learn group-focus-visible:text-learn">
          {r.title}
        </span>
        <span className="mt-1 block truncate text-[12.5px] text-text-tertiary">
          {r.source.replace(/ on YouTube$/, "")} · {about}
        </span>
      </span>
    </span>
  );
  const cls = cn("group block w-full text-left outline-none", className);
  return plays ? (
    <button
      type="button"
      onClick={() => onPlay?.(item)}
      className={cls}
      aria-label={`Play video: ${r.title}`}
    >
      {body}
    </button>
  ) : (
    <a href={r.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  );
}

/**
 * An auto-scrolling row. The items are laid out twice and the track slides by
 * one copy, so the loop has no seam; the duration comes from the copy's width,
 * so every row moves at the same slow speed. It stops while `paused` (the
 * section is hovered, a video is open), while a card has focus, and while the
 * row is off screen. When the items fit, it doesn't move at all.
 */
export function Marquee({
  children,
  reverse,
  paused,
  speed = 32,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  paused?: boolean;
  /** Pixels per second. */
  speed?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const dupe = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loop, setLoop] = useState(true);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (!box.current || !copy.current) return;
      setWidth(copy.current.offsetWidth);
      setLoop(copy.current.offsetWidth > box.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    if (copy.current) ro.observe(copy.current);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (box.current) io.observe(box.current);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [children]);

  // Keep the duplicate's links and buttons out of the tab order.
  useEffect(() => {
    dupe.current
      ?.querySelectorAll<HTMLElement>("a, button")
      .forEach((el) => el.setAttribute("tabindex", "-1"));
  });

  const stopped = paused || focused || !visible;
  return (
    <div
      ref={box}
      data-reverse={reverse || undefined}
      data-paused={stopped || undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        "learn-marquee overflow-hidden motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:none]",
        loop && "[mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]",
        className,
      )}
    >
      <div
        className={cn("flex w-max pb-1 pt-2", loop && "learn-marquee-track")}
        style={{ "--marquee-duration": `${Math.max(20, width / speed)}s` } as CSSProperties}
      >
        <div ref={copy} className="flex shrink-0 gap-5 pr-5">
          {children}
        </div>
        {/* The seamless-loop copy. It must stay clickable: half the time (the
            whole time, on a reversed row) it's the copy on screen. Hidden from
            screen readers, and out of the tab order (see the effect above). */}
        {loop && (
          <div ref={dupe} aria-hidden className="flex shrink-0 gap-5 pr-5 motion-reduce:hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * WebAIM and W3C publish no preview image: a quiet drawn tile instead. Text
 * stays in the top two thirds, clear of the card's notched label.
 */
function DrawnTile({ item }: { item: CatalogItem }) {
  const r = item.resource;
  return (
    <span className="bg-grain flex h-full w-full flex-col gap-2 bg-gradient-to-br from-bg-tertiary to-bg-elevated px-5 pt-4">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
        {r.kind === "tool" ? "Tool" : r.minutes ? "Article" : "Reference"}
      </span>
      <span className="font-display text-[34px] leading-none text-foreground">{r.source}</span>
    </span>
  );
}

/** A horizontal carousel: native scroll with snapping, plus arrow buttons. */
export function Rail({
  title,
  meta,
  children,
  resetKey,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  /** Scrolls back to the start when it changes (e.g. a new topic). */
  resetKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft < 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, resetKey]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const scrollable = !(edge.start && edge.end);
  // Fade only the edge that has more to scroll to.
  const mask = `linear-gradient(to right, ${edge.start ? "#000" : "transparent"} 0, #000 32px, #000 calc(100% - 48px), ${edge.end ? "#000" : "transparent"} 100%)`;

  return (
    <div>
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground">{title}</div>
          {meta && <div className="mt-0.5 text-[13px] text-text-tertiary">{meta}</div>}
        </div>
        <div className={cn("flex shrink-0 gap-1.5", !scrollable && "invisible")}>
          {([-1, 1] as const).map((dir) => {
            const Icon = dir < 0 ? ChevronLeft : ChevronRight;
            const off = dir < 0 ? edge.start : edge.end;
            return (
              <button
                key={dir}
                type="button"
                onClick={() => page(dir)}
                disabled={off}
                aria-label={dir < 0 ? "Previous" : "Next"}
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-bg-tertiary text-foreground transition-colors duration-300 hover:bg-bg-elevated disabled:cursor-default disabled:opacity-35 disabled:hover:bg-bg-tertiary"
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
      <div
        ref={ref}
        onScroll={measure}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

/** The in-place video player. Esc, the backdrop or ✕ closes it. */
export function VideoLightbox({
  item,
  onClose,
}: {
  item: CatalogItem | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (typeof document === "undefined") return null;
  const src = item && embedUrl(item.resource);
  const article = item?.principle.resources.find((r) => r.kind !== "video");

  return createPortal(
    <AnimatePresence>
      {item && src && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.resource.title}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative w-full max-w-4xl"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="absolute -top-11 right-0 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              <iframe
                src={src}
                title={item.resource.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-2 text-white">
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold">{item.principle.name}</p>
                <p className="mt-0.5 text-[14px] text-white/70">{item.principle.idea}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {article && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
                  >
                    Read: {resourceMeta(article)}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
                <a
                  href={item.resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
                >
                  Watch on YouTube
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
