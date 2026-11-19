import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/uxcc/Logo";
import { BlurIn, COLUMN, Card, CheckDot, GlossText, PillTabs, Section } from "./primitives";
import { CosmicButton, SolidButton } from "@/components/ui/cosmic-button";
import { CtaScene } from "./Scenery";
import { TYPE } from "./type";
import { BeamChip } from "./BeamChip";

// Pricing, FAQ, final call to action, and footer. Plans mirror
// BuyCreditsModal and lib/pricing.ts — keep them in sync.

type Billing = "monthly" | "yearly";

// Three plans, each saying who it's for in plain words. Vibe coders and
// developers lead (foundations/voice-and-naming.md).
const FREE_FEATURES = ["5 credits to start", "Screens and flows", "A fix prompt for every issue"];
const PRO_FEATURES = [
  "Unlimited single-screen reviews",
  "Unlimited flow reviews, 2–8 screens",
  "A fix prompt for every issue",
  "Free follow-up questions",
  "PDF and Markdown export",
];
const PACK_FEATURES = ["10 credits, no expiry", "1 per screen, 3 per flow", "Top up whenever"];

/** Serif price with a small cadence suffix: "$10/month". */
function Price({ amount, per }: { amount: string; per: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={TYPE.number}
        >
          {amount}
        </motion.span>
      </AnimatePresence>
      <span className={TYPE.caption}>/{per}</span>
    </div>
  );
}

/** One plan: name, who it's for, price, action, what's in it. */
function Plan({
  name,
  forWho,
  price,
  action,
  features,
  aside,
  featured,
}: {
  name: string;
  forWho: string;
  price: ReactNode;
  action: ReactNode;
  features: string[];
  aside?: ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-6 sm:p-7",
        featured && "border border-border bg-bg-tertiary shadow-sm",
      )}
    >
      <div className="flex min-h-[42px] flex-wrap items-center justify-between gap-2">
        <h3 className={TYPE.title}>{name}</h3>
        {aside}
      </div>
      <p className={cn(TYPE.body, "mt-1")}>{forWho}</p>
      <div className="mt-6">{price}</div>
      <div className="mt-6">{action}</div>
      <div className="my-6 border-t border-dashed border-border-strong" />
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <CheckDot className={featured ? undefined : "opacity-80"} />
            <span className={cn(TYPE.list, "text-[15px] text-foreground")}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
  const { openBuyCredits } = useAuth();
  const [billing, setBilling] = useState<Billing>("monthly");
  const yearly = billing === "yearly";

  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title={<>Start free. Pay when it&rsquo;s useful.</>}
      lede="Credits are charged only when a review finishes. A failed run costs nothing."
    >
      <BlurIn>
        <Card className="grid gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
          <Plan
            name="Free"
            forWho="For anyone trying it on their next screen. No account, no card."
            price={<Price amount="$0" per="to start" />}
            action={
              <SolidButton as="link" to="/app" className="w-full">
                Start free
              </SolidButton>
            }
            features={FREE_FEATURES}
          />
          <Plan
            featured
            name="Pro"
            forWho={
              yearly
                ? "For agencies and teams on client work all year."
                : "For developers and founders shipping every week."
            }
            aside={
              <PillTabs
                tabs={[
                  { id: "monthly", label: "Monthly" },
                  { id: "yearly", label: "Yearly" },
                ]}
                value={billing}
                onChange={setBilling}
                layoutId="pricing-billing"
              />
            }
            price={
              <div className="flex flex-wrap items-center gap-3">
                <Price amount={yearly ? "$99" : "$10"} per={yearly ? "year" : "month"} />
                {yearly && (
                  <BeamChip className="px-2.5 py-0.5 text-[12px] font-medium">Save $21</BeamChip>
                )}
              </div>
            }
            action={
              <CosmicButton as="button" onClick={openBuyCredits} className="w-full">
                {yearly ? "Go yearly" : "Get Pro"}
              </CosmicButton>
            }
            features={PRO_FEATURES}
          />
          <Plan
            name="Credit pack"
            forWho="For vibe coders who ship now and then. Pay as you go, no plan."
            price={<Price amount="$5" per="one-time" />}
            action={
              <SolidButton as="button" onClick={openBuyCredits} className="w-full">
                Buy credits
              </SolidButton>
            }
            features={PACK_FEATURES}
          />
        </Card>
      </BlurIn>
    </Section>
  );
}

const FAQS = [
  {
    q: "What happens to my screenshots?",
    a: "They're sent to our AI provider to generate the review and aren't kept on our servers. Your reviews, screenshots included, are saved only in your own browser.",
  },
  {
    q: "Why does it sometimes ask me questions?",
    a: "Only when the answer would change the advice and it can't tell from the screen, like whether a store sells to consumers or businesses. Most screenshots need zero or one question, never more than three, and you can always skip.",
  },
  {
    q: "What can I upload?",
    a: "PNG, JPG, or WEBP up to 5MB. Use single-screen mode for one screen, or flow mode for 2–8 screens in the order a user sees them.",
  },
  {
    q: "Which tools do the fix prompts work with?",
    a: "Any AI coding tool that takes plain English: Cursor, v0, Lovable, Bolt, Claude, ChatGPT. Each prompt names the location, the problem, the fix, and the principle to respect.",
  },
  {
    q: "How accurate are the pins?",
    a: "They mark roughly where each issue is, which is enough to find it at a glance. The written finding always says exactly which element it means.",
  },
  {
    q: "What does a credit buy?",
    a: "One single-screen review costs 1 credit, a flow costs 3. Follow-up questions about a finished review are free, and nothing is charged if a run fails.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" eyebrow="FAQ" title="Questions, answered">
      <div className="border-t border-border">
        {FAQS.map((f, i) => (
          <BlurIn key={f.q} delay={i * 0.04}>
            <div className="border-b border-border">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className={TYPE.title}>{f.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  className="shrink-0 text-text-tertiary"
                >
                  <Plus className="h-5 w-5" strokeWidth={1.75} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className={cn(TYPE.body, "max-w-[640px] pb-5")}>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BlurIn>
        ))}
      </div>
    </Section>
  );
}

export function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  return (
    <section ref={ref} className="relative overflow-hidden">
      <CtaScene progress={scrollYProgress} />
      <div className="relative z-10 mx-auto flex min-h-[max(56.25vw,520px)] max-w-[620px] flex-col items-center px-6 pb-[18vw] pt-[11vw] text-center">
        <BlurIn>
          <h2 className={TYPE.closing}>
            <GlossText>Something&rsquo;s off. Find out what.</GlossText>
          </h2>
        </BlurIn>
        <BlurIn delay={0.1}>
          <p className={cn(TYPE.lede, "mx-auto mt-4 max-w-[440px]")}>
            Your first five reviews are free. No account needed to start.
          </p>
        </BlurIn>
        <BlurIn delay={0.2}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CosmicButton href="#top">
              Review a screenshot <ArrowRight className="h-4 w-4" />
            </CosmicButton>
            <SolidButton as="link" to="/app/samples">
              See samples
            </SolidButton>
          </div>
        </BlurIn>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { label: "Examples", href: "#examples" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Dats Off.", href: "#why" },
  { label: "Resources", href: "#learn" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const APP_LINKS = [
  { label: "New review", to: "/app" },
  { label: "Library", to: "/app/library" },
  { label: "Samples", to: "/app/samples" },
  { label: "Settings", to: "/app/settings" },
] as const;

export function Footer() {
  return (
    <footer className="overflow-hidden px-4 pt-20 sm:px-6">
      <div className={cn(COLUMN, "flex flex-col items-center text-center")}>
        <Logo />
        <p className={cn(TYPE.body, "mt-4 max-w-[420px]")}>
          The design review your AI coding tool never did: what's off, a prompt to fix it, and the
          why.
        </p>
        <nav
          aria-label="Footer"
          className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 sm:gap-x-10"
        >
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[17px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-[18px]"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 text-[13px] text-text-tertiary">
          {APP_LINKS.map((l, i) => (
            <span key={l.to} className="flex items-center">
              {i > 0 && <span aria-hidden className="mx-3 h-3 w-px bg-border-strong" />}
              <Link to={l.to} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            </span>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-text-tertiary">
          © {new Date().getFullYear()} Dats Off.
        </p>
      </div>
      <GlossyWordmark />
    </footer>
  );
}

/**
 * The full-width "Dats off." sign-off. Glossy: the letters are a grey
 * gradient clipped to the text, fading into the page at the bottom, with a
 * light sheen that sweeps across as the footer scrolls into view.
 */
function GlossyWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const sheen = useTransform(scrollYProgress, [0, 1], [reduce ? 45 : 100, 45]);
  const backgroundPosition = useMotionTemplate`${sheen}% 0, 0 0, 0 0`;

  return (
    <div ref={ref} aria-hidden className="mt-12 select-none sm:mt-16">
      <motion.div
        style={{ backgroundPosition }}
        className="gloss-text -mx-4 whitespace-nowrap text-center text-[29vw] font-bold leading-[0.8] tracking-[-0.065em] sm:-mx-6"
      >
        Dats off.
      </motion.div>
    </div>
  );
}
