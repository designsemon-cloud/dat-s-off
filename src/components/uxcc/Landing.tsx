import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { PromptComposer } from "@/components/uxcc/PromptComposer";
import { Logo } from "@/components/uxcc/Logo";
import { ThemeToggle } from "@/components/uxcc/ThemeToggle";
import { HeroScene } from "@/components/landing/Scenery";
import { TOOLS, ToolLogo, ToolStack } from "@/components/landing/ToolLogos";
import { Showcase } from "@/components/landing/Showcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Engine, WhatItCatches } from "@/components/landing/Capabilities";
import { Learn } from "@/components/landing/Learn";
import { WhyDatsOff } from "@/components/landing/WhyDatsOff";
import { FAQ, FinalCTA, Footer, Pricing } from "@/components/landing/Closing";
import { initLandingScrollFx } from "@/components/landing/scroll-fx";
import { LiquidGlassDefs } from "@/components/landing/LiquidGlass";
import { BeamChip } from "@/components/landing/BeamChip";
import { BlurIn, COLUMN, Eyebrow, ShieldCheck, Tile } from "@/components/landing/primitives";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { useAuth } from "@/lib/auth-context";
import { useComposer } from "@/lib/use-composer";
import { cn } from "@/lib/utils";
import { TYPE } from "@/components/landing/type";

// Marketing landing page (see design-system/templates/landing-template.md).
// Grey grain page, a full-bleed engraved hero scene with the title and
// composer in its open sky, and sections in one narrow column. Lenis smooths
// the scroll so the scroll-driven pieces (scene blur, scrubbed text, CTA
// curtain) glide. The hero composer starts a real session and hands off to
// /app/s/$id.

const NAV_LINKS = [
  { label: "Examples", href: "#examples" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Resources", href: "#learn" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Landing() {
  const { composerProps } = useComposer();
  const { user, openAuth } = useAuth();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  // Lenis drives the scroll from GSAP's ticker, so the GSAP scroll effects
  // (scroll-fx.ts) and the smooth scroll read the same frame.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const stopFx = pageRef.current ? initLandingScrollFx(pageRef.current) : () => {};
    if (reduce) return stopFx;
    const lenis = new Lenis({ autoRaf: false, anchors: { offset: -88 } });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      stopFx();
    };
  }, [reduce]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // As the hero scrolls away the scene blurs and sinks (HeroScene) while the
  // copy lifts and fades a little faster.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <div
      id="top"
      ref={pageRef}
      className="bg-grain relative min-h-screen bg-background text-foreground"
    >
      <LiquidGlassDefs />
      {/* Nav: logo on the left, a floating pill on the right. Both turn to
          liquid glass once the page scrolls (.liquid-glass in styles.css). */}
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div
            className={cn(
              "rounded-lg px-3 py-1.5 transition-[background-color,box-shadow] duration-500",
              scrolled && "liquid-glass",
            )}
          >
            <Logo reload />
          </div>
          <nav
            className={cn(
              "relative flex items-center gap-1 rounded-lg border p-1 transition-[background-color,border-color,box-shadow] duration-500",
              scrolled
                ? "liquid-glass border-transparent"
                : "border-border bg-bg-tertiary shadow-sm",
            )}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hidden h-8 items-center rounded-md px-3 text-[14px] text-foreground transition-colors hover:bg-foreground/[0.06] md:inline-flex"
              >
                {l.label}
              </a>
            ))}
            {!user && (
              <button
                onClick={openAuth}
                className="hidden h-8 items-center rounded-md px-3 text-[14px] text-foreground transition-colors hover:bg-foreground/[0.06] sm:inline-flex"
              >
                Sign in
              </button>
            )}
            <ThemeToggle className="rounded-md" />
            <CosmicButton as="link" to="/app" size="sm">
              Open app
            </CosmicButton>
          </nav>
        </div>
      </header>

      {/* Hero — full-bleed engraved landscape; title and composer centered
          in its open sky */}
      {/* overflow-x-clip (not hidden): the blurred scene may drift below the
          hero as it scrolls away instead of being cut off at its edge. */}
      <section ref={heroRef} className="relative overflow-x-clip">
        <HeroScene progress={scrollYProgress} />
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 mx-auto flex min-h-[100svh] max-w-[720px] flex-col items-center px-5 pb-[max(21vw,190px)] pt-32 text-center sm:pt-36"
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex"
          >
            <BeamChip className="py-1 pl-1.5 pr-3 text-[14px] font-medium">
              <ShieldCheck className="h-5 w-5" />5 free reviews, no sign-up
            </BeamChip>
          </motion.span>

          <h1 className={cn(TYPE.hero, "mt-6")}>
            <HeroWords text="The design review" />{" "}
            <HeroWords text="your AI never did." delay={0.35} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className={cn(TYPE.lede, "mt-5 max-w-[540px]")}
          >
            Drop a screenshot of what you built. See what&rsquo;s off, why it matters, and get a
            prompt to paste into <ToolStack className="ml-0.5" />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-8 w-full text-left"
          >
            <PromptComposer {...composerProps} />
          </motion.div>
        </motion.div>
      </section>

      {/* Tools the fix prompts are written for */}
      <section className="px-4 pt-20 sm:px-6">
        <div className={COLUMN}>
          <Eyebrow>Fix prompts written for</Eyebrow>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {TOOLS.map((t, i) => (
              <BlurIn key={t.name} delay={i * 0.07}>
                <div data-fx="wave">
                  <Tile className="h-20 sm:h-24">
                    <span title={t.name}>
                      <ToolLogo tool={t} />
                    </span>
                  </Tile>
                </div>
              </BlurIn>
            ))}
          </div>
        </div>
      </section>

      {/* Order (Nov 2026): why it's different, then what it catches, then the
          product itself; learning before the engine; who it's for lives in
          pricing. */}
      <WhyDatsOff />
      <WhatItCatches />
      <Showcase />
      <HowItWorks />
      <Learn />
      <Engine />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/** Headline words that rise out of a blur one after another on load. */
function HeroWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="gloss-heading inline-block"
        >
          {w}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </>
  );
}
