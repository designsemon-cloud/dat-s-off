// Learn the why: the UX principle behind each issue, with a short article or
// video to read up on it. See design-system/patterns/learning.md.
//
// The catalog is hand-curated and every link is checked
// (`npm run check:links` → scripts/check-learn-links.mjs). Resources never
// come from the model: models invent plausible URLs, and a dead "learn more"
// link costs more trust than no link.
//
// Minutes are measured, not guessed: article words ÷ 230, video length from
// YouTube. W3C "Understanding" pages are reference specs, so they have none.
//
// This file is plain, type-strippable TypeScript (no enums, no path aliases),
// so the link checker can import it directly with Node.

export type ResourceKind = "article" | "video" | "tool";

export interface LearnResource {
  kind: ResourceKind;
  title: string;
  source: string;
  url: string;
  minutes?: number;
  /** Link check only: words the page's <title> (or the video's title) must contain. */
  expect: string;
}

export type Topic = "heuristics" | "laws" | "gestalt" | "design" | "accessibility";

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "heuristics", label: "Heuristics" },
  { id: "laws", label: "Laws of UX" },
  { id: "gestalt", label: "Gestalt" },
  { id: "design", label: "Design & copy" },
  { id: "accessibility", label: "Accessibility" },
];

export interface Principle {
  key: string;
  topic: Topic;
  name: string;
  /** One plain-English line for a developer who has never heard of it. */
  idea: string;
  /** Matched against the free-text `principle` of older critiques and samples. */
  aliases: RegExp[];
  /** Catch-all words ("WCAG", "Gestalt"), used only when no specific alias matches. */
  broad?: RegExp[];
  resources: LearnResource[];
}

const nng = (slug: string, title: string, minutes: number, expect = title): LearnResource => ({
  kind: "article",
  title,
  source: "NN/g",
  url: `https://www.nngroup.com/articles/${slug}/`,
  minutes,
  expect,
});
const nngVideo = (id: string, title: string, minutes: number, expect = title): LearnResource => ({
  kind: "video",
  title,
  source: "NN/g on YouTube",
  url: `https://www.youtube.com/watch?v=${id}`,
  minutes,
  expect,
});
const lawsOfUx = (slug: string, title: string, minutes: number): LearnResource => ({
  kind: "article",
  title,
  source: "Laws of UX",
  url: `https://lawsofux.com/${slug}/`,
  minutes,
  expect: title,
});
const w3c = (path: string, title: string, expect: string): LearnResource => ({
  kind: "article",
  title,
  source: "W3C",
  url: `https://www.w3.org/WAI/${path}`,
  expect,
});

// Matching: the specific alias found earliest in the text wins; ties go to
// catalog order. `broad` words ("WCAG", "Gestalt", "Nielsen") count only when
// nothing specific matches, so "WCAG 1.4.3: Contrast" lands on text contrast.
export const PRINCIPLES: Principle[] = [
  // Nielsen's 10 heuristics
  {
    key: "visibility-of-status",
    topic: "heuristics",
    name: "Visibility of system status",
    idea: "Always show people what's happening: loading, saving, done, failed.",
    aliases: [
      /nielsen\s*#?\s*1\b/i,
      /system status/i,
      /loading state/i,
      /progress indicator/i,
      /response time/i,
    ],
    resources: [
      nng("visibility-system-status", "Visibility of System Status", 8),
      nngVideo("cTtc90jCULU", "Visibility of System Status", 3),
      nng(
        "progress-indicators",
        "Progress Indicators Make a Slow System Less Insufferable",
        12,
        "Progress Indicators",
      ),
    ],
  },
  {
    key: "match-real-world",
    topic: "heuristics",
    name: "Match the real world",
    idea: "Use the words and order your users already know, not your database's.",
    aliases: [/nielsen\s*#?\s*2\b/i, /real[- ]world/i, /mental model/i, /jargon/i],
    resources: [
      nng("match-system-real-world", "Match Between the System and the Real World", 6),
      nngVideo("0TAt9Pln51g", "Match Between the System and the Real World", 3),
    ],
  },
  {
    key: "user-control",
    topic: "heuristics",
    name: "User control and freedom",
    idea: "Give people a clear way out: undo, cancel, back, close.",
    aliases: [/nielsen\s*#?\s*3\b/i, /user control/i, /\bundo\b/i, /emergency exit/i],
    resources: [
      nng("user-control-and-freedom", "User Control and Freedom", 10),
      nngVideo("MXuk-fdbr0A", "User Control & Freedom", 2),
    ],
  },
  {
    key: "consistency",
    topic: "heuristics",
    name: "Consistency and standards",
    idea: "The same thing should look and behave the same everywhere in your app.",
    aliases: [/nielsen\s*#?\s*4\b/i, /consisten/i],
    resources: [
      nng(
        "consistency-and-standards",
        "Maintain Consistency and Adhere to Standards",
        10,
        "Consistency and",
      ),
      nngVideo("Ibndy9KLOSQ", "Consistency and Standards", 3),
    ],
  },
  {
    key: "error-prevention",
    topic: "heuristics",
    name: "Error prevention",
    idea: "Design so mistakes are hard to make: confirm destructive actions, guard easy slips.",
    aliases: [
      /nielsen\s*#?\s*5\b/i,
      /error prevention/i,
      /defensive/i,
      /\bslips?\b/i,
      /destructive/i,
      /confirmation/i,
    ],
    resources: [
      nng(
        "slips",
        "Preventing User Errors: Avoiding Unconscious Slips",
        7,
        "Preventing User Errors",
      ),
      nngVideo("s0hStSMc_Rs", "Slips vs. Mistakes", 3),
      nng(
        "confirmation-dialog",
        "Confirmation Dialogs Can Prevent User Errors",
        8,
        "Confirmation Dialogs",
      ),
    ],
  },
  {
    key: "recognition-over-recall",
    topic: "heuristics",
    name: "Recognition over recall",
    idea: "Show the options; don't make people remember them from another screen.",
    aliases: [/nielsen\s*#?\s*6\b/i, /recognition/i, /\brecall\b/i],
    resources: [
      nng(
        "recognition-and-recall",
        "Memory Recognition and Recall in User Interfaces",
        10,
        "Recognition and Recall",
      ),
      nngVideo(
        "6glQPp6q4Jc",
        "Recognition vs. Recall in User Interfaces",
        3,
        "Recognition vs. Recall",
      ),
    ],
  },
  {
    key: "flexibility-efficiency",
    topic: "heuristics",
    name: "Flexibility and efficiency",
    idea: "Let frequent users go faster: shortcuts, defaults, bulk actions.",
    aliases: [/nielsen\s*#?\s*7\b/i, /flexibility/i, /efficiency of use/i, /shortcut/i],
    resources: [
      nng("flexibility-efficiency-heuristic", "Flexibility and Efficiency of Use", 8),
      nngVideo("LoTdRTBB8BQ", "Flexibility and Efficiency of Use", 3),
    ],
  },
  {
    key: "minimalist-design",
    topic: "heuristics",
    name: "Aesthetic and minimalist design",
    idea: "Every extra element competes with the ones that matter. Cut what doesn't help.",
    aliases: [/nielsen\s*#?\s*8\b/i, /minimalis/i, /clutter/i, /signal[- ]to[- ]noise/i],
    resources: [
      nng("aesthetic-minimalist-design", "Aesthetic and Minimalist Design", 6),
      nngVideo("ZgbRmeWDgd0", "Aesthetic and Minimalist Design", 2),
    ],
  },
  {
    key: "error-recovery",
    topic: "heuristics",
    name: "Help users recover from errors",
    idea: "Error messages should say what went wrong, in plain words, and how to fix it.",
    aliases: [/nielsen\s*#?\s*9\b/i, /recover from errors/i, /error message/i, /error recovery/i],
    resources: [
      nng("error-message-guidelines", "Error-Message Guidelines", 7),
      nngVideo("sReni_EeZUM", "Error Messages 101", 3),
    ],
  },
  {
    key: "help-documentation",
    topic: "heuristics",
    name: "Help and documentation",
    idea: "Put help where the question comes up, short and specific to the task.",
    aliases: [/nielsen\s*#?\s*10\b/i, /help and documentation/i, /tooltip/i, /onboarding/i],
    resources: [
      nng("help-and-documentation", "Help and Documentation", 8),
      nng("tooltip-guidelines", "Tooltip Guidelines", 6),
    ],
  },

  // Laws
  {
    key: "fitts-law",
    topic: "laws",
    name: "Fitts's law",
    idea: "Big, close targets are fast to hit. Small, far ones are slow and get missed.",
    aliases: [/fitts/i],
    resources: [
      nng("fitts-law", "Fitts's Law and Its Applications in UX", 11, "Its Applications in UX"),
      nngVideo("M-9FbUJk6tI", "Fitts's Law", 2),
      lawsOfUx("fittss-law", "Fitts's Law", 2),
    ],
  },
  {
    key: "hicks-law",
    topic: "laws",
    name: "Hick's law",
    idea: "The more choices you show at once, the longer it takes to pick one.",
    aliases: [/hick/i, /too many (choices|options)/i, /choice overload/i],
    resources: [lawsOfUx("hicks-law", "Hick's Law", 2)],
  },
  {
    key: "von-restorff",
    topic: "laws",
    name: "Von Restorff effect",
    idea: "The one thing that looks different gets noticed. Make it the thing that matters.",
    aliases: [/restorff/i, /isolation effect/i],
    resources: [lawsOfUx("von-restorff-effect", "Von Restorff Effect", 1)],
  },
  {
    key: "aesthetic-usability",
    topic: "laws",
    name: "Aesthetic-usability effect",
    idea: "People trust, and forgive, interfaces that look cared for.",
    aliases: [/aesthetic[- ]usability/i],
    resources: [lawsOfUx("aesthetic-usability-effect", "Aesthetic-Usability Effect", 2)],
  },
  {
    key: "platform-conventions",
    topic: "laws",
    name: "Platform conventions",
    idea: "People expect your app to work like the others they use. Follow the pattern they know.",
    aliases: [/platform convention/i, /jakob'?s law/i],
    broad: [/\bconventions?\b/i],
    resources: [
      lawsOfUx("jakobs-law", "Jakob's Law", 2),
      nng("touch-target-size", "Touch Targets on Touchscreens", 9),
    ],
  },

  // Gestalt
  {
    key: "gestalt-proximity",
    topic: "gestalt",
    name: "Proximity",
    idea: "Things placed close together read as one group. Spacing is structure.",
    aliases: [/proximity/i, /spacing/i, /whitespace/i],
    resources: [
      nng("gestalt-proximity", "Proximity Principle in Visual Design", 6),
      nngVideo(
        "7JTDGGJT_Ng",
        "Proximity: Gestalt Principle for UI Design",
        3,
        "Proximity: Gestalt Principle",
      ),
      lawsOfUx("law-of-proximity", "Law of Proximity", 1),
    ],
  },
  {
    key: "gestalt-common-region",
    topic: "gestalt",
    name: "Common region",
    idea: "A shared container (card, border, background) tells people these items belong together.",
    aliases: [/common region/i, /grouping/i],
    resources: [
      nng(
        "common-region",
        "The Principle of Common Region: Containers Create Groupings",
        7,
        "Common Region",
      ),
      nngVideo(
        "clqzTQ-nTig",
        "Common Region: Gestalt Principle for UI Design",
        3,
        "Common Region: Gestalt Principle",
      ),
    ],
  },
  {
    key: "gestalt-similarity",
    topic: "gestalt",
    name: "Similarity",
    idea: "Things that look alike are read as working alike. Style by meaning, not by accident.",
    aliases: [/similarity/i],
    broad: [/gestalt/i],
    resources: [
      nng("gestalt-similarity", "Similarity Principle in Visual Design", 8),
      nngVideo(
        "aTYn1Ac6-Tk",
        "Similarity: Gestalt Principle for UI Design",
        3,
        "Similarity: Gestalt Principle",
      ),
    ],
  },

  // Visual design
  {
    key: "visual-hierarchy",
    topic: "design",
    name: "Visual hierarchy",
    idea: "Size, weight, contrast and position tell people what to look at first. Decide what that is.",
    aliases: [
      /hierarchy/i,
      /cognitive walkthrough/i,
      /next action/i,
      /scannab/i,
      /f[- ]pattern/i,
      /primary action/i,
    ],
    resources: [
      nng("visual-hierarchy-ux-definition", "Visual Hierarchy in UX: Definition", 7),
      nngVideo("XU1-Rz2Q7-E", "F-Pattern in Reading Digital Content", 3),
    ],
  },
  {
    key: "feedback-affordance",
    topic: "design",
    name: "Feedback and affordance",
    idea: "Clickable things should look clickable, and respond when used: hover, press, disabled.",
    aliases: [/affordance/i, /feedback/i, /clickab/i, /button state/i, /signifier/i],
    resources: [
      nng(
        "clickable-elements",
        "Beyond Blue Links: Making Clickable Elements Recognizable",
        6,
        "Clickable Elements",
      ),
      nngVideo("3xfagjg5iRA", "Button States 101", 3),
      nngVideo("pDFMWXr-v_E", "Flat UI Elements Lack Clickability Clues", 5),
    ],
  },
  {
    key: "empty-states",
    topic: "design",
    name: "Empty states",
    idea: "An empty screen should say why it's empty and what to do first.",
    aliases: [/empty state/i, /zero state/i, /first[- ]run/i],
    resources: [
      nng(
        "empty-state-interface-design",
        "Designing Empty States in Complex Applications",
        8,
        "Designing Empty States",
      ),
    ],
  },
  {
    key: "forms",
    topic: "design",
    name: "Forms and input",
    idea: "Clear labels, the right keyboard, and validation as people type, not after submit.",
    aliases: [/\bforms?\b/i, /input field/i, /validation/i, /\blabels?\b/i],
    resources: [
      nng(
        "mobile-input-checklist",
        "A Checklist for Designing Mobile Input Fields",
        2,
        "Mobile Input Fields",
      ),
      nng("indicators-validations-notifications", "Indicators, Validations, and Notifications", 11),
    ],
  },
  {
    key: "ux-writing",
    topic: "design",
    name: "UX writing",
    idea: "Short, specific words that say what happens next. People scan, they don't read.",
    aliases: [/ux writing/i, /microcopy/i, /\bcopy\b/i, /wording/i, /tone of voice/i, /readab/i],
    resources: [
      nng("ux-writing-study-guide", "UX Writing: Study Guide", 8),
      nngVideo("HSpms43ycKg", "Establishing Tone of Voice", 3),
      nng("how-users-read-on-the-web", "How Users Read on the Web", 4),
    ],
  },

  // Accessibility (WCAG)
  {
    key: "text-contrast",
    topic: "accessibility",
    name: "Text contrast (WCAG 1.4.3)",
    idea: "Text needs at least 4.5:1 contrast with its background (3:1 when large) to be readable by everyone.",
    aliases: [/1\.4\.3/, /\bcontrast\b/i],
    resources: [
      {
        kind: "article",
        title: "Contrast and Color Accessibility",
        source: "WebAIM",
        url: "https://webaim.org/articles/contrast/",
        minutes: 11,
        expect: "Contrast and Color Accessibility",
      },
      {
        kind: "tool",
        title: "Contrast Checker",
        source: "WebAIM",
        url: "https://webaim.org/resources/contrastchecker/",
        expect: "Contrast Checker",
      },
      w3c(
        "WCAG21/Understanding/contrast-minimum.html",
        "Understanding 1.4.3: Contrast (Minimum)",
        "1.4.3",
      ),
    ],
  },
  {
    key: "non-text-contrast",
    topic: "accessibility",
    name: "Non-text contrast (WCAG 1.4.11)",
    idea: "Borders, icons and focus rings people need to see must have 3:1 contrast too.",
    aliases: [/1\.4\.11/, /non[- ]text contrast/i, /focus (ring|indicator)/i],
    resources: [
      w3c(
        "WCAG21/Understanding/non-text-contrast.html",
        "Understanding 1.4.11: Non-text Contrast",
        "1.4.11",
      ),
      {
        kind: "tool",
        title: "Contrast Checker",
        source: "WebAIM",
        url: "https://webaim.org/resources/contrastchecker/",
        expect: "Contrast Checker",
      },
    ],
  },
  {
    key: "use-of-color",
    topic: "accessibility",
    name: "Don't rely on color alone (WCAG 1.4.1)",
    idea: "Pair color with text, an icon or a pattern, so it still works for color-blind users.",
    aliases: [
      /1\.4\.1\b/,
      /use of colou?r/i,
      /colou?r alone/i,
      /colou?r[- ]only/i,
      /colou?r ?blind/i,
    ],
    resources: [
      w3c("WCAG21/Understanding/use-of-color.html", "Understanding 1.4.1: Use of Color", "1.4.1"),
    ],
  },
  {
    key: "target-size",
    topic: "accessibility",
    name: "Target size (WCAG 2.5.5 / 2.5.8)",
    idea: "Tap targets should be at least 24px, ideally 44px, with space between them.",
    aliases: [/2\.5\.[58]/, /target size/i, /touch target/i, /tap target/i, /hit area/i],
    resources: [
      nng("touch-target-size", "Touch Targets on Touchscreens", 9),
      w3c(
        "WCAG22/Understanding/target-size-minimum.html",
        "Understanding 2.5.8: Target Size (Minimum)",
        "2.5.8",
      ),
    ],
  },
  {
    key: "accessibility",
    topic: "accessibility",
    name: "Accessibility",
    idea: "Design that works for people with low vision, motor limits or a screen reader works better for everyone.",
    aliases: [],
    broad: [/accessib/i, /\bwcag\b/i, /\ba11y\b/i],
    resources: [
      {
        kind: "article",
        title: "Contrast and Color Accessibility",
        source: "WebAIM",
        url: "https://webaim.org/articles/contrast/",
        minutes: 11,
        expect: "Contrast and Color Accessibility",
      },
    ],
  },

  // Fallback for "Nielsen" with no number
  {
    key: "usability-heuristics",
    topic: "heuristics",
    name: "Nielsen's 10 usability heuristics",
    idea: "Ten rules of thumb that catch most usability problems. Worth knowing by heart.",
    aliases: [],
    broad: [/nielsen/i, /heuristic/i],
    resources: [
      nng(
        "ten-usability-heuristics",
        "10 Usability Heuristics for User Interface Design",
        9,
        "10 Usability Heuristics",
      ),
      nngVideo("6Bw0n6Jvwxk", "Heuristic Evaluation of User Interfaces", 3),
    ],
  },
];

const BY_KEY = new Map(PRINCIPLES.map((p) => [p.key, p]));

export const PRINCIPLE_KEYS = PRINCIPLES.map((p) => p.key);

export function principleByKey(key: string | undefined | null): Principle | null {
  return (key && BY_KEY.get(key)) || null;
}

/**
 * The catalog principle a free-text principle names
 * ("Visual Hierarchy & Fitts's Law" → visual hierarchy).
 */
export function matchPrinciple(text: string | undefined | null): Principle | null {
  if (!text) return null;
  return earliest(text, (p) => p.aliases) ?? earliest(text, (p) => p.broad ?? []);
}

function earliest(text: string, pick: (p: Principle) => RegExp[]): Principle | null {
  let best: Principle | null = null;
  let at = Infinity;
  for (const p of PRINCIPLES) {
    for (const a of pick(p)) {
      const m = a.exec(text);
      if (m && m.index < at) {
        best = p;
        at = m.index;
      }
    }
  }
  return best;
}

/** What to learn for one issue (or win): the model's key first, else the text. */
export function learnFor(item: { principle?: string; principleKey?: string }): Principle | null {
  return principleByKey(item.principleKey) ?? matchPrinciple(item.principle);
}

/** Every principle in a critique, issues first, without repeats. */
export function principlesIn(items: { principle?: string; principleKey?: string }[]): Principle[] {
  const seen = new Set<string>();
  const out: Principle[] = [];
  for (const it of items) {
    const p = learnFor(it);
    if (p && !seen.has(p.key)) {
      seen.add(p.key);
      out.push(p);
    }
  }
  return out;
}

/** "4 min read", "3 min video", "Tool", or "Reference" (W3C specs). */
export function resourceMeta(r: LearnResource): string {
  if (r.kind === "tool") return "Tool";
  if (!r.minutes) return "Reference";
  return r.kind === "video" ? `${r.minutes} min video` : `${r.minutes} min read`;
}

/**
 * The model sometimes copies the key into the readable `principle` too
 * ("minimalist-design"). Turn a bare key back into its name.
 */
export function readablePrinciple(text: string): string {
  return principleByKey(text.trim())?.name ?? text;
}

/** For the prompt: "key (Name)" lines the model chooses from. */
export function principleKeyList(): string {
  return PRINCIPLES.map((p) => `${p.key} (${p.name})`).join(", ");
}

// Previews -----------------------------------------------------------------

const NNG_OG = "https://media.nngroup.com/media/articles/opengraph_images/";

/**
 * Each article's own social preview (its og:image), checked by
 * `npm run check:links`. WebAIM and W3C publish none; they get a drawn tile.
 */
const ARTICLE_IMAGES: Record<string, string> = {
  "https://www.nngroup.com/articles/visibility-system-status/": `${NNG_OG}visibility-system-status.png`,
  "https://www.nngroup.com/articles/progress-indicators/": `${NNG_OG}Slide16articlesprogress-indicators.png`,
  "https://www.nngroup.com/articles/match-system-real-world/": `${NNG_OG}match-system-real-world.png`,
  "https://www.nngroup.com/articles/user-control-and-freedom/": `${NNG_OG}User_Control_Freedom_Social-Media-Posts_2020-42.png`,
  "https://www.nngroup.com/articles/consistency-and-standards/": `${NNG_OG}Maintain-Consistency-Standards_Social-Media-Posts_2021-65.png`,
  "https://www.nngroup.com/articles/slips/": `${NNG_OG}Preventing_User_Errors_-_Slips_1.jpg`,
  "https://www.nngroup.com/articles/confirmation-dialog/": `${NNG_OG}confirmation-dialogs-error-prevention.png`,
  "https://www.nngroup.com/articles/recognition-and-recall/": `${NNG_OG}Memory_Recognition_openg-32.jpg`,
  "https://www.nngroup.com/articles/flexibility-efficiency-heuristic/": `${NNG_OG}Flexibility_Efficiency_of_Use_Social-Media-Posts_2020-39.png`,
  "https://www.nngroup.com/articles/aesthetic-minimalist-design/": `${NNG_OG}Aesthetic-Minimalist-Design_Social-Media-Posts_2021-94.png`,
  "https://www.nngroup.com/articles/error-message-guidelines/": `${NNG_OG}ErrorMessages_81.jpg`,
  "https://www.nngroup.com/articles/help-and-documentation/": `${NNG_OG}Help_Documentation_Social-Media-Posts_2020-45.png`,
  "https://www.nngroup.com/articles/tooltip-guidelines/": `${NNG_OG}tooltip-guidelines.png`,
  "https://www.nngroup.com/articles/fitts-law/": `${NNG_OG}FittsLaw-Application_89.png`,
  "https://www.nngroup.com/articles/touch-target-size/": `${NNG_OG}touch-targets.png`,
  "https://www.nngroup.com/articles/gestalt-proximity/": `${NNG_OG}Proximity-Principle-Visual-Design_Social-Media-Posts_2020-compressor.png`,
  "https://www.nngroup.com/articles/common-region/": `${NNG_OG}Principle-Common-Region_Social-Media-Posts_2020-compressor.png`,
  "https://www.nngroup.com/articles/gestalt-similarity/": `${NNG_OG}Similarity_Principle_Social-Media-Posts_2020-66.png`,
  "https://www.nngroup.com/articles/visual-hierarchy-ux-definition/": `${NNG_OG}Visual-Hierarchy-in-UX_Social-Media-Posts_2021-71.png`,
  "https://www.nngroup.com/articles/clickable-elements/": `${NNG_OG}Slide27articlesclickable-elements.png`,
  "https://www.nngroup.com/articles/empty-state-interface-design/": `${NNG_OG}DesigningEmptyStatesComplexApps_Social-Media-Posts_2021-01.png`,
  "https://www.nngroup.com/articles/mobile-input-checklist/": `${NNG_OG}Slide44articlesmobile-input-checklist.png`,
  "https://www.nngroup.com/articles/indicators-validations-notifications/": `${NNG_OG}Ind_Val_Nots_openg-37.jpg`,
  "https://www.nngroup.com/articles/ux-writing-study-guide/": `${NNG_OG}UX_writing_study_guide_47.png`,
  "https://www.nngroup.com/articles/how-users-read-on-the-web/": `${NNG_OG}SocialMediaPosts_20-30_01.png`,
  "https://www.nngroup.com/articles/ten-usability-heuristics/": `${NNG_OG}Updated10HeuristicSocialCard-36.png`,
  "https://lawsofux.com/fittss-law/": "https://lawsofux.com/fittss-law/social.png",
  "https://lawsofux.com/hicks-law/": "https://lawsofux.com/hicks-law/social.png",
  "https://lawsofux.com/von-restorff-effect/":
    "https://lawsofux.com/von-restorff-effect/social.png",
  "https://lawsofux.com/aesthetic-usability-effect/":
    "https://lawsofux.com/aesthetic-usability-effect/social.png",
  "https://lawsofux.com/jakobs-law/": "https://lawsofux.com/jakobs-law/social.png",
  "https://lawsofux.com/law-of-proximity/": "https://lawsofux.com/law-of-proximity/social.png",
};

/** Measured video lengths, in seconds (YouTube `lengthSeconds`). */
const VIDEO_SECONDS: Record<string, number> = {
  "6Bw0n6Jvwxk": 193,
  cTtc90jCULU: 156,
  "0TAt9Pln51g": 189,
  "MXuk-fdbr0A": 136,
  Ibndy9KLOSQ: 158,
  s0hStSMc_Rs: 186,
  "6glQPp6q4Jc": 169,
  LoTdRTBB8BQ: 175,
  ZgbRmeWDgd0: 118,
  sReni_EeZUM: 165,
  "7JTDGGJT_Ng": 171,
  "clqzTQ-nTig": 197,
  "aTYn1Ac6-Tk": 161,
  "M-9FbUJk6tI": 122,
  HSpms43ycKg: 159,
  "XU1-Rz2Q7-E": 160,
  "pDFMWXr-v_E": 309,
  rDOVYO5aMSg: 226,
  "3xfagjg5iRA": 179,
};

/** The YouTube id of a video resource, else null. */
export function youtubeId(r: LearnResource): string | null {
  return r.url.match(/youtube\.com\/watch\?v=([\w-]{11})/)?.[1] ?? null;
}

/**
 * The preview image: a video's YouTube frame (hqdefault is 4:3 with the 16:9
 * frame letterboxed inside, so a 16:9 cover crop shows exactly the frame), or
 * an article's own social card. Null for sources without one.
 */
export function previewImage(r: LearnResource): string | null {
  const id = youtubeId(r);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return ARTICLE_IMAGES[r.url] ?? null;
}

/** "3:13" for a video, else null. */
export function videoLength(r: LearnResource): string | null {
  const id = youtubeId(r);
  const s = id ? VIDEO_SECONDS[id] : undefined;
  return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : null;
}

/** Privacy-enhanced embed (no cookies until play). */
export function embedUrl(r: LearnResource): string | null {
  const id = youtubeId(r);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
    : null;
}

export interface CatalogItem {
  resource: LearnResource;
  /** The first principle that lists it. */
  principle: Principle;
}

/** Every resource once, in catalog order, with the principle it teaches. */
export function catalogItems(): CatalogItem[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  for (const principle of PRINCIPLES)
    for (const resource of principle.resources)
      if (!seen.has(resource.url)) {
        seen.add(resource.url);
        out.push({ resource, principle });
      }
  return out;
}
