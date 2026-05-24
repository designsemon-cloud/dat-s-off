export type Severity = "high" | "medium" | "low";

export interface UXFix {
  id: string;
  title: string;
  severity: Severity;
  principle: string;
  problem: string;
  why: string;
  solution: string;
  code: string;
  language: string;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  fixes: UXFix[];
}

export const TECH_STACKS = [
  { id: "react-tailwind", label: "React + Tailwind", lang: "tsx" },
  { id: "react-css", label: "React + CSS", lang: "tsx" },
  { id: "vue", label: "Vue 3", lang: "vue" },
  { id: "html-css", label: "HTML + CSS", lang: "html" },
  { id: "swiftui", label: "SwiftUI", lang: "swift" },
  { id: "flutter", label: "Flutter", lang: "dart" },
] as const;

export const DEVICES = [
  { id: "desktop", label: "Desktop", icon: "monitor" },
  { id: "tablet", label: "Tablet", icon: "tablet" },
  { id: "mobile", label: "Mobile", icon: "smartphone" },
] as const;

export const MOCK_RESULT: AnalysisResult = {
  score: 72,
  summary:
    "Solid foundation with clear hierarchy, but accessibility, touch targets, and visual feedback need work to feel production-grade.",
  fixes: [
    {
      id: "1",
      title: "Primary CTA lacks visual prominence",
      severity: "high",
      principle: "Visual Hierarchy & Fitts's Law",
      problem:
        "Your 'Get Started' button blends into the surrounding cards. Users scan F-pattern and miss the primary action — expect 30-40% lower conversion.",
      why:
        "Primary CTAs should win the visual fight. Larger size, higher contrast, and a confident accent color guide the eye and reduce decision time (Hick's Law).",
      solution:
        "Increase button size, add a gradient fill with a soft glow, and lift it with a subtle shadow. Reserve this treatment for ONE action per screen.",
      code: `<button
  className="
    inline-flex items-center justify-center
    px-8 py-4 text-base font-semibold
    rounded-xl text-white
    bg-gradient-to-r from-indigo-500 to-violet-500
    shadow-lg shadow-indigo-500/30
    hover:shadow-xl hover:shadow-indigo-500/40
    hover:-translate-y-0.5
    transition-all duration-200
  "
>
  Get Started
  <ArrowRight className="ml-2 h-4 w-4" />
</button>`,
      language: "tsx",
    },
    {
      id: "2",
      title: "Touch targets below 44px minimum",
      severity: "high",
      principle: "Accessibility (WCAG 2.5.5)",
      problem:
        "Icon buttons measure ~32px. On mobile this fails Apple HIG (44px) and Google Material (48px) guidelines — leading to mis-taps and frustration.",
      why:
        "Fingertip contact area averages 10mm. Small targets force pixel-precision tapping, hurting users with motor impairments and anyone in motion.",
      solution:
        "Wrap icons in a 44×44 hit area while keeping the visual icon small. Use padding, not size, to expand the target.",
      code: `<button
  aria-label="Close dialog"
  className="
    inline-flex h-11 w-11 items-center justify-center
    rounded-lg text-zinc-400
    hover:bg-zinc-800 hover:text-white
    focus-visible:ring-2 focus-visible:ring-indigo-500
    transition-colors
  "
>
  <X className="h-5 w-5" />
</button>`,
      language: "tsx",
    },
    {
      id: "3",
      title: "Form inputs missing focus states",
      severity: "medium",
      principle: "Feedback & Affordance",
      problem:
        "Inputs only change border color subtly on focus. Keyboard users can't track where they are — a WCAG 2.4.7 violation.",
      why:
        "Visible focus indicators are critical for keyboard navigation, screen reader users, and anyone temporarily using their keyboard (broken trackpad, RSI).",
      solution:
        "Add a 2px ring offset from the input with your accent color. Pair with a subtle border shift for layered feedback.",
      code: `<input
  type="email"
  placeholder="you@company.com"
  className="
    w-full px-4 py-3 rounded-lg
    bg-zinc-900 border border-zinc-700
    text-white placeholder:text-zinc-500
    focus:outline-none
    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    focus:ring-offset-zinc-950
    focus:border-indigo-500
    transition-all
  "
/>`,
      language: "tsx",
    },
    {
      id: "4",
      title: "Text contrast fails AA on body copy",
      severity: "medium",
      principle: "Color Contrast (WCAG 1.4.3)",
      problem:
        "Secondary text at #71717A on #18181F yields 3.8:1 contrast — below the 4.5:1 minimum for body text. Hard to read in bright environments.",
      why:
        "Low contrast disproportionately impacts users with low vision (~8% of men have color vision deficiency) and anyone reading on a sunny patio.",
      solution:
        "Bump secondary text to a lighter shade. Reserve dimmer text only for truly tertiary metadata.",
      code: `/* tailwind.config or styles.css */
:root {
  /* Was: text-secondary: #71717A (3.8:1) */
  --text-secondary: #A1A1AA; /* 7.2:1 — passes AAA */
  --text-tertiary: #71717A;  /* metadata only */
}`,
      language: "css",
    },
    {
      id: "5",
      title: "No empty / loading / error states",
      severity: "low",
      principle: "Defensive UX",
      problem:
        "When the data list is empty, users see a blank container. No skeleton on load, no retry on error — feels broken.",
      why:
        "Every async surface has 4 states: empty, loading, error, success. Designing only success leads to confusion the moment reality hits.",
      solution:
        "Add a skeleton shimmer for loading, an illustrated empty state with a clear CTA, and an error state with a retry action.",
      code: `{isLoading ? (
  <SkeletonList count={3} />
) : error ? (
  <ErrorState
    message="Couldn't load projects"
    onRetry={refetch}
  />
) : items.length === 0 ? (
  <EmptyState
    icon={Inbox}
    title="No projects yet"
    description="Create your first project to get started."
    action={<Button onClick={onCreate}>New project</Button>}
  />
) : (
  <ProjectList items={items} />
)}`,
      language: "tsx",
    },
  ],
};
