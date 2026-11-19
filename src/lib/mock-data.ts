export type Severity = "high" | "medium" | "low";

export interface UXFix {
  id: string;
  title: string;
  severity: Severity;
  principle: string;
  /** The learning catalog's key for `principle` (lib/learn.ts), or "other". */
  principleKey?: string;
  problem: string;
  why: string;
  solution: string;
  code: string;
  language: string;
  /** Ready-to-paste prompt for Cursor/v0/Lovable that fixes this specific issue. */
  fixPrompt: string;
  /**
   * Where the issue sits on the screenshot, as 0–1 fractions of its width/height.
   * Shown only once the locate pass has grounded it (`locator.status === "verified"`)
   * or on hand-placed samples.
   */
  region?: IssueRegion | null;
  /** What the locate pass found for this issue (lib/locate.ts). */
  locator?: IssueLocator;
  /** Where on the screen the issue is, in words ("account header, top right"). */
  location?: string;
  /** 2–4 concrete implementation steps for the fix. */
  steps?: string[];
  /** What must not change while fixing this. */
  avoid?: string[];
  /** Observable checks that prove the fix worked. */
  acceptance?: string[];
  /** Re-checks: id of the previous version's issue this one continues (still open or partly fixed). */
  carriedFrom?: string | null;
}

export interface IssueLocator {
  /**
   * verified: tied to a detected element and confirmed on a close-up.
   * unconfirmed: an element was picked but the close-up didn't confirm it.
   * none: not tied to one visible element (e.g. the layout as a whole).
   */
  status: "verified" | "unconfirmed" | "none";
  /** The element, in words ("Save button, top right of the form"). */
  element: string;
}

/** Re-checks: the critique being re-checked, sent with the updated screenshot. */
export interface PreviousCritique {
  /** Single screens: the previous screenshot (data URL), shown to the model beside the new one. */
  image?: string;
  score: number;
  issues: { id: string; title: string; severity: Severity; problem: string }[];
}

/** Re-checks: what happened to one issue from the previous version. */
export interface IssueProgress {
  previousId: string;
  /** unseen: the issue's area isn't in the new screenshot (cropped out), so it can't be judged. */
  status: "fixed" | "partly" | "open" | "unseen";
  /** One short sentence on what changed (or didn't). */
  note: string;
}

export interface IssueRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UXWin {
  id: string;
  title: string;
  principle: string;
  /** The learning catalog's key for `principle` (lib/learn.ts), or "other". */
  principleKey?: string;
  explanation: string;
}

export interface AnalysisResult {
  score: number;
  /** Direct answer to the user's question (or "what to fix first"), 1–3 sentences. */
  answer?: string;
  summary: string;
  /** One sentence on how the model interpreted the AnalysisContext. */
  contextSummary?: string;
  fixes: UXFix[];
  wins: UXWin[];
  /** One prompt covering every fix, for pasting into an AI coding tool in a single pass. */
  consolidatedFixPrompt: string;
  /** Re-checks only: the previous version's issues, each marked fixed / partly / open. */
  progress?: IssueProgress[];
}

export interface AnalysisContext {
  productType: string;
  primaryUser: string;
  primaryTask: string;
  focusArea: string;
  platform: "web" | "mobile" | "both";
  stage: string;
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
      why: "Primary CTAs should win the visual fight. Larger size, higher contrast, and a confident accent color guide the eye and reduce decision time (Hick's Law).",
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
      fixPrompt:
        "Make the primary 'Get Started' CTA the most prominent element on this screen. Increase its padding to px-8 py-4 with text-base font-semibold, give it a gradient fill using the brand accent, add a soft colored shadow (shadow-lg with the accent at ~30% opacity), and a subtle hover lift (-translate-y-0.5 plus a stronger shadow). Keep this treatment on this one button only — demote any competing buttons to secondary/ghost styles.",
    },
    {
      id: "2",
      title: "Touch targets below 44px minimum",
      severity: "high",
      principle: "Accessibility (WCAG 2.5.5)",
      problem:
        "Icon buttons measure ~32px. On mobile this fails Apple HIG (44px) and Google Material (48px) guidelines — leading to mis-taps and frustration.",
      why: "Fingertip contact area averages 10mm. Small targets force pixel-precision tapping, hurting users with motor impairments and anyone in motion.",
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
      fixPrompt:
        "Every icon-only button on this screen has a hit area of about 32px, below the 44×44px minimum. Expand each one to h-11 w-11 (44px) using padding/fixed sizing while keeping the icon itself at h-5 w-5. Add an aria-label describing each button's action, plus a visible focus-visible ring. Don't change the icons' visual size.",
    },
    {
      id: "3",
      title: "Form inputs missing focus states",
      severity: "medium",
      principle: "Feedback & Affordance",
      problem:
        "Inputs only change border color subtly on focus. Keyboard users can't track where they are — a WCAG 2.4.7 violation.",
      why: "Visible focus indicators are critical for keyboard navigation, screen reader users, and anyone temporarily using their keyboard (broken trackpad, RSI).",
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
      fixPrompt:
        "Give every form input on this screen a clearly visible focus state for keyboard users (WCAG 2.4.7). On focus, remove the default outline and add a 2px accent-colored ring with a 2px offset matching the page background, plus a border color change to the same accent. Apply it consistently to all inputs, selects, and textareas.",
    },
    {
      id: "4",
      title: "Text contrast fails AA on body copy",
      severity: "medium",
      principle: "Color Contrast (WCAG 1.4.3)",
      problem:
        "Secondary text at #71717A on #18181F yields 3.8:1 contrast — below the 4.5:1 minimum for body text. Hard to read in bright environments.",
      why: "Low contrast disproportionately impacts users with low vision (~8% of men have color vision deficiency) and anyone reading on a sunny patio.",
      solution:
        "Bump secondary text to a lighter shade. Reserve dimmer text only for truly tertiary metadata.",
      code: `/* tailwind.config or styles.css */
:root {
  /* Was: text-secondary: #71717A (3.8:1) */
  --text-secondary: #A1A1AA; /* 7.2:1 — passes AAA */
  --text-tertiary: #71717A;  /* metadata only */
}`,
      language: "css",
      fixPrompt:
        "Secondary body text (#71717A on #18181F) has a 3.8:1 contrast ratio, which fails WCAG AA. Change the secondary text color token to #A1A1AA (about 7.2:1) and apply it to all body and supporting copy. Keep #71717A only as a tertiary token for small metadata like timestamps. Update the token, not individual components.",
    },
    {
      id: "5",
      title: "No empty / loading / error states",
      severity: "low",
      principle: "Defensive UX",
      problem:
        "When the data list is empty, users see a blank container. No skeleton on load, no retry on error — feels broken.",
      why: "Every async surface has 4 states: empty, loading, error, success. Designing only success leads to confusion the moment reality hits.",
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
      fixPrompt:
        "The project list currently only handles the success state. Add the three missing states: (1) while loading, show a skeleton list of 3 shimmering placeholder rows; (2) on error, show an error message with a 'Retry' button that refetches; (3) when the list is empty, show an empty state with an icon, the title 'No projects yet', a one-line description, and a 'New project' button. Render exactly one state at a time.",
    },
  ],
  wins: [
    {
      id: "w1",
      title: "Clear typographic hierarchy",
      principle: "Visual Hierarchy",
      explanation:
        "Headings, subheadings, and body text use distinct, consistent sizes and weights, so users can scan the page and understand its structure at a glance.",
    },
    {
      id: "w2",
      title: "Consistent spacing rhythm",
      principle: "Gestalt: Proximity",
      explanation:
        "Related elements are grouped tightly and sections are separated by generous, consistent gaps. That makes the layout feel organized and easy to parse.",
    },
  ],
  consolidatedFixPrompt:
    "Apply these UX fixes to this screen, in priority order:\n\n1. Primary CTA prominence: make 'Get Started' the dominant element (larger padding, accent gradient fill, soft colored shadow, subtle hover lift). Demote competing buttons to secondary/ghost.\n2. Touch targets: expand every icon-only button to a 44×44px hit area (h-11 w-11) without enlarging the icon. Add aria-labels and focus-visible rings.\n3. Input focus states: give all inputs/selects/textareas a 2px accent focus ring with a 2px offset and an accent border on focus.\n4. Text contrast: change the secondary text token from #71717A to #A1A1AA so body copy passes WCAG AA. Keep #71717A for small metadata only.\n5. Async states: add loading (skeleton rows), error (message + Retry), and empty (icon, title, description, 'New project' CTA) states to the project list.\n\nKeep the existing visual style and design tokens. Change only what's needed for these fixes.",
};
