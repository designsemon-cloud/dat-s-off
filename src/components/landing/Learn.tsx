import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Pause } from "lucide-react";
import { Marquee, ResourceCard, VideoLightbox } from "@/components/learn/LearnMedia";
import { catalogItems, PRINCIPLES, TOPICS, type CatalogItem, type Topic } from "@/lib/learn";
import { cn } from "@/lib/utils";
import { BlurIn, Section } from "./primitives";
import { TYPE } from "./type";

// "Learn as you fix": the learning library on the landing page, so people can
// come here just to learn. All of it is the checked catalog the critiques link
// to (lib/learn.ts); see design-system/patterns/learning.md.
//
// - Topic tabs after cult-ui's Direction-aware tabs: a pill slides to the
//   topic, and the rows slide in from that side.
// - Two rows drift on their own inside the page column, Watch to the left and
//   Read to the right, slowly. Hovering the library stops both, so a card can be read and
//   clicked; so do keyboard focus, an open video, and scrolling past.
// - Cutout cards (components/learn/LearnMedia.tsx): videos play right here,
//   articles open in a new tab.

const ITEMS = catalogItems();
const SOURCES = [...new Set(ITEMS.map((i) => i.resource.source.replace(/ on YouTube$/, "")))];
const TABS: { id: Topic | "all"; label: string }[] = [{ id: "all", label: "All" }, ...TOPICS];

export function Learn() {
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState(false);
  const [playing, setPlaying] = useState<CatalogItem | null>(null);

  const shown = useMemo(
    () => (topic === "all" ? ITEMS : ITEMS.filter((i) => i.principle.topic === topic)),
    [topic],
  );
  const videos = shown.filter((i) => i.resource.kind === "video");
  const reads = shown.filter((i) => i.resource.kind !== "video");
  const paused = hover || playing !== null;

  const pick = (id: Topic | "all") => {
    if (id === topic) return;
    const at = (t: Topic | "all") => TABS.findIndex((x) => x.id === t);
    setDir(at(id) > at(topic) ? 1 : -1);
    setTopic(id);
  };

  return (
    <Section
      id="learn"
      eyebrow="Learn as you fix"
      title={<>Learn the why behind every fix.</>}
      lede="Short videos and articles on the principles behind good interfaces, picked by hand and checked. Every review links each issue to one of them."
      className="overflow-x-clip"
      accent="learn"
    >
      {/* Topics: a sliding pill (direction-aware tabs). */}
      <BlurIn>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div
            role="tablist"
            aria-label="Topics"
            className="inline-flex gap-1 rounded-full border border-border bg-bg-tertiary/70 p-1 shadow-[inset_0_1px_2px_rgba(15,17,20,0.06)] backdrop-blur-sm dark:bg-bg-elevated/60"
          >
            {TABS.map((t) => {
              const on = topic === t.id;
              const count =
                t.id === "all"
                  ? ITEMS.length
                  : ITEMS.filter((i) => i.principle.topic === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => pick(t.id)}
                  className={cn(
                    "relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-300",
                    on ? "text-background" : "text-muted-foreground hover:text-learn",
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {on && (
                    <motion.span
                      layoutId="learn-topic-pill"
                      className="absolute inset-0 rounded-full bg-learn shadow-sm"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                    />
                  )}
                  <span className="relative">
                    {t.label}
                    <span className={cn("ml-1.5 tabular-nums", on ? "opacity-60" : "opacity-70")}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </BlurIn>

      {/* The rows stay in the page column, faded at both edges. */}
      <div
        className="relative mt-10"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* popLayout: the new rows take their place while the old slide out, so
            the section never collapses and the page doesn't jump. */}
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={topic}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: 48 * d, opacity: 0, filter: "blur(4px)" }),
              center: { x: 0, opacity: 1, filter: "blur(0px)" },
              exit: (d: number) => ({ x: -48 * d, opacity: 0, filter: "blur(4px)" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            <Row
              title="Watch"
              dir={1}
              meta={
                videos.length
                  ? `${videos.length} short ${videos.length === 1 ? "video" : "videos"} from NN/g · plays right here`
                  : "No videos on this topic yet. The reading below covers it."
              }
              paused={paused}
            >
              {videos.length > 0 && (
                <Marquee paused={paused}>
                  {videos.map((item) => (
                    <ResourceCard
                      key={item.resource.url}
                      item={item}
                      onPlay={setPlaying}
                      className="w-[264px] sm:w-[300px]"
                    />
                  ))}
                </Marquee>
              )}
            </Row>
            <Row
              title="Read"
              dir={-1}
              meta={`${reads.length} ${reads.length === 1 ? "article" : "articles and tools"} · opens in a new tab`}
              paused={paused}
            >
              <Marquee paused={paused} reverse>
                {reads.map((item) => (
                  <ResourceCard
                    key={item.resource.url}
                    item={item}
                    className="w-[236px] sm:w-[260px]"
                  />
                ))}
              </Marquee>
            </Row>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className={TYPE.caption}>
          {PRINCIPLES.length} principles from {SOURCES.slice(0, -1).join(", ")} and {SOURCES.at(-1)}
          . Every link is checked before it ships.
        </p>
        <Link
          to="/app/s/$sessionId"
          params={{ sessionId: "sample-salesforce" }}
          className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-learn underline-offset-4 hover:underline"
        >
          See it in a sample review
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <VideoLightbox item={playing} onClose={() => setPlaying(null)} />
    </Section>
  );
}

/**
 * A row header, then its marquee. `dir`: the side the row slides in from as
 * the section arrives (scroll-fx.ts), the way its cards then drift.
 */
function Row({
  title,
  meta,
  paused,
  dir,
  children,
}: {
  title: string;
  meta: string;
  paused: boolean;
  dir: 1 | -1;
  children: React.ReactNode;
}) {
  return (
    <div data-fx="row-in" data-dir={dir}>
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground">{title}</div>
          <div className="mt-0.5 text-[13px] text-text-tertiary">{meta}</div>
        </div>
        {/* A quiet cue that the rows stop for you. */}
        <span
          aria-hidden
          className={cn(
            "hidden shrink-0 items-center gap-1.5 text-[12px] text-learn transition-opacity duration-500 motion-reduce:hidden sm:inline-flex",
            paused ? "opacity-100" : "opacity-0",
          )}
        >
          <Pause className="h-3 w-3" fill="currentColor" strokeWidth={0} />
          Paused
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
