import type { AnalysisResult } from "./mock-data";
import type { Session } from "./session-types";

// Pre-built critiques shown on the landing page and the Samples screen.
// Regions were measured by hand against /public/salesforce.png (note its grey
// margin around the UI) and /public/amazon.jpg.

const SALESFORCE: AnalysisResult = {
  score: 61,
  answer:
    "Yes, it's cluttered, and it's mostly because nothing leads. Four columns and four equal-looking buttons compete, so reps can't see the next step. Start by making New Event the one filled primary button, then give empty fields an 'Add …' prompt.",
  summary:
    "A dense, capable console where four columns compete for attention. Core record data is hard to scan, small link targets slow down frequent actions, and empty fields give reps no cue to complete the record.",
  contextSummary:
    "Read as a B2B CRM sales console used daily by sales reps to review and update an account record.",
  fixes: [
    {
      id: "1",
      title: "No clear primary action on the record",
      severity: "high",
      principle: "Von Restorff Effect",
      problem:
        "Follow, Edit, New Event, and Email all share the same outlined treatment, so nothing tells a rep what to do next on this account.",
      why: "When every action looks equal, reps hesitate or pick the wrong one. The most common next step should stand out.",
      solution:
        "Promote the most frequent action (e.g. New Event or Email) to a filled primary button and keep the rest secondary.",
      fixPrompt:
        "In the account header and Activity composer, Follow, Edit, New Event and Email all use the same outlined button style. Please make the single most common action (New Event) a filled primary button and keep Follow, Edit and Email as secondary outline buttons. Make sure only one primary action is visible per panel so it clearly stands out.",
      code: "",
      language: "text",
      region: { x: 0.306, y: 0.276, w: 0.355, h: 0.058 },
    },
    {
      id: "2",
      title: "Empty fields give no cue to add data",
      severity: "high",
      principle: "Nielsen #6: Recognition over recall",
      problem:
        "Type, Phone, Website, and Industry are blank with no placeholder or inline edit affordance, so the record looks broken rather than incomplete.",
      why: "Reps must remember that fields are editable via the Edit button. Incomplete records stay incomplete.",
      solution:
        "Show an 'Add phone' style placeholder with a pencil icon on hover for every empty field, editable inline.",
      fixPrompt:
        "In the account details panel, empty fields (Type, Phone, Website, Industry) render as blank space. Please show a muted 'Add {field}' placeholder with a pencil icon on hover, and let clicking it edit the field inline. Make sure empty fields are visibly distinct from filled ones so reps recognize what's missing.",
      code: "",
      language: "text",
      region: { x: 0.306, y: 0.345, w: 0.157, h: 0.175 },
    },
    {
      id: "3",
      title: "Activity links are tiny tap targets",
      severity: "medium",
      principle: "Fitts' Law",
      problem:
        "Refresh, Expand All, and View All are small inline text links separated by dots, well below a 44×44px hit area.",
      why: "These are clicked many times a day; small targets add friction and mis-clicks, especially on laptops with trackpads.",
      solution: "Turn them into compact ghost buttons with at least 32px height and clear spacing.",
      fixPrompt:
        "In the Activity panel's toolbar, Refresh, Expand All and View All are tiny dot-separated text links. Please convert them into compact ghost buttons at least 32px tall with 8px gaps. Make sure each target is easy to hit and visually grouped with the filters row.",
      code: "",
      language: "text",
      region: { x: 0.696, y: 0.359, w: 0.111, h: 0.019 },
    },
    {
      id: "4",
      title: "Right-rail labels are truncated",
      severity: "medium",
      principle: "Nielsen #8: Aesthetic and minimalist design",
      problem:
        "'We found no potential duplicates of this Acco…' and 'Resource Prefere…' are cut off, hiding meaning.",
      why: "Truncated labels force hovering or guessing, and the duplicate check reads as a warning when it's actually good news.",
      solution: "Shorten the copy ('No duplicates found') and let card titles wrap to two lines.",
      fixPrompt:
        "In the right-hand related lists, card titles like 'We found no potential duplicates of this Account' and 'Resource Preferences' are truncated with ellipses. Please shorten the duplicate message to 'No duplicates found' with a green check, and allow card titles to wrap to two lines. Make sure no label is truncated at common laptop widths.",
      code: "",
      language: "text",
      region: { x: 0.823, y: 0.218, w: 0.123, h: 0.272 },
    },
    {
      id: "5",
      title: "Account list rows are hard to scan",
      severity: "low",
      principle: "WCAG 1.4.3: Contrast",
      problem:
        "List rows use light grey text on a light grey background with secondary info (phone, region, status) in the same weight.",
      why: "Low contrast and flat hierarchy slow down finding the right account in a long list.",
      solution:
        "Darken primary text, make the account name semibold, and push metadata to a smaller muted line.",
      fixPrompt:
        "In the All Accounts list on the left, row text is light grey on light grey and the account name has the same weight as phone and status. Please make account names semibold with at least 4.5:1 contrast and put phone/region/status on a smaller muted second line. Make sure names are scannable at a glance.",
      code: "",
      language: "text",
      region: { x: 0.053, y: 0.34, w: 0.223, h: 0.514 },
    },
  ],
  wins: [
    {
      id: "w1",
      title: "Helpful empty activity state",
      principle: "Nielsen #10: Help and documentation",
      explanation:
        "'No activities to show. Get started by sending an email, scheduling a task, and more.' tells reps exactly what to do next instead of leaving a blank box.",
    },
    {
      id: "w2",
      title: "Consistent tabbed record navigation",
      principle: "Nielsen #4: Consistency and standards",
      explanation:
        "Activity, Chatter, Details and News follow a familiar tab pattern, so reps always know where record information lives.",
    },
  ],
  consolidatedFixPrompt:
    "Fix these high-severity UX issues on the account record screen:\n\n1. Primary action: make New Event a filled primary button and keep Follow, Edit and Email as secondary outline buttons, so only one action stands out per panel.\n2. Empty fields: show a muted 'Add {field}' placeholder with a pencil icon for every empty field in the details panel, editable inline.\n\nKeep the existing layout and design tokens; change only what these fixes need.",
};

const AMAZON: AnalysisResult = {
  score: 68,
  answer:
    "Shoppers can find products, but they can't judge them from here. The gift and accessory rows show images with no name or price, so every comparison costs a click. Add a name and bold price under each tile first; that fixes most of it.",
  summary:
    "Search is prominent and sections are well grouped, but the page leans on imagery without prices or context, small links and arrows are easy to miss, and the right rail of ads competes with the products shoppers came for.",
  contextSummary:
    "Read as a B2C e-commerce homepage where a returning shopper wants to find and evaluate products quickly.",
  fixes: [
    {
      id: "1",
      title: "Product tiles show no price or name",
      severity: "high",
      principle: "Nielsen #6: Recognition over recall",
      problem:
        "The 'Budget accessories' and 'Fun gift ideas' rows are images only, so shoppers can't judge price or relevance without clicking each item.",
      why: "The section promises 'budget' and 'under $10' but hides the one fact that proves it, increasing pogo-sticking and drop-off.",
      solution: "Add a short product name and price under every tile.",
      fixPrompt:
        "In the 'Budget accessories with free shipping' and 'Fun gift ideas for $10 and under' carousels, product tiles show only an image. Please add a one-line product name and the price under each tile, with the price in bold. Make sure shoppers can compare items without clicking into them.",
      code: "",
      language: "text",
      region: { x: 0.022, y: 0.312, w: 0.743, h: 0.318 },
    },
    {
      id: "2",
      title: "Ad rail competes with the main content",
      severity: "medium",
      principle: "Nielsen #8: Aesthetic and minimalist design",
      problem:
        "The right column stacks three large promotional banners with the same visual weight as the product rows.",
      why: "Shoppers' attention splits between ads and products, and banner blindness makes the real content easier to skip too.",
      solution:
        "Reduce the rail to one smaller, clearly labeled sponsored card, or move promotions into the main flow.",
      fixPrompt:
        "On the homepage, the right-hand column has three tall promotional banners competing with the product carousels. Please reduce it to a single smaller card labeled 'Sponsored' and give the freed space to the main content column. Make sure products remain the visually dominant content.",
      code: "",
      language: "text",
      region: { x: 0.793, y: 0.274, w: 0.205, h: 0.7 },
    },
    {
      id: "3",
      title: "'See more' links are easy to miss",
      severity: "medium",
      principle: "Fitts' Law",
      problem:
        "'See more' is small blue text sitting right after each section heading, with a tiny hit area.",
      why: "It's the main way into each category, but its size and placement make it look like an afterthought.",
      solution:
        "Right-align 'See all →' at the end of each section header as a larger, padded link.",
      fixPrompt:
        "In each homepage section header, the 'See more' link is tiny blue text right after the title. Please move it to the right end of the header row as 'See all →' with at least a 32px tall hit area. Make sure it reads as the primary way into each category.",
      code: "",
      language: "text",
      region: { x: 0.274, y: 0.286, w: 0.042, h: 0.012 },
    },
    {
      id: "4",
      title: "Carousel arrows have low contrast",
      severity: "low",
      principle: "WCAG 1.4.11: Non-text contrast",
      problem:
        "The grey translucent arrows over product images and the thin hero arrows blend into the content behind them.",
      why: "Users may not realize the rows scroll, so most products in each carousel go unseen.",
      solution: "Use solid circular arrow buttons with a white fill, shadow, and 3:1 contrast.",
      fixPrompt:
        "On the hero banner and product carousels, the previous/next arrows are thin or semi-transparent and blend into the images. Please replace them with solid white circular buttons (40px) with a subtle shadow and a dark chevron. Make sure the arrows have at least 3:1 contrast against any image behind them.",
      code: "",
      language: "text",
      region: { x: 0.737, y: 0.342, w: 0.028, h: 0.061 },
    },
    {
      id: "5",
      title: "'Quick look' only appears on hover",
      severity: "low",
      principle: "Platform conventions (touch)",
      problem: "The Quick look button is revealed on hover, which doesn't exist on touch devices.",
      why: "Tablet shoppers never discover a useful shortcut.",
      solution: "Expose Quick look via a visible icon or long-press on touch devices.",
      fixPrompt:
        "On product tiles, the 'Quick look' button only appears on hover. Please show a small always-visible eye icon on touch devices (and keep the hover reveal on desktop). Make sure the feature is discoverable without a mouse.",
      code: "",
      language: "text",
      region: { x: 0.006, y: 0.6, w: 0.094, h: 0.022 },
    },
  ],
  wins: [
    {
      id: "w1",
      title: "Search is impossible to miss",
      principle: "Von Restorff Effect",
      explanation:
        "The full-width search field with a high-contrast orange button anchors the header, matching the main way returning shoppers start.",
    },
    {
      id: "w2",
      title: "Clear, themed sections",
      principle: "Gestalt: Common region",
      explanation:
        "Each row has a plain-language heading ('Budget watches with free shipping') and its own band, so the page is easy to skim by intent.",
    },
  ],
  consolidatedFixPrompt:
    "Fix this high-severity UX issue on the homepage:\n\n1. Product tiles: in every product carousel, add a one-line product name and a bold price under each tile so shoppers can compare items without clicking.\n\nKeep the existing layout and design tokens; change only what this fix needs.",
};

function sampleSession(
  id: string,
  title: string,
  imageUrl: string,
  prompt: string,
  result: AnalysisResult,
): Session {
  const at = "2026-01-01T00:00:00.000Z";
  const attachment = {
    id: `${id}-img`,
    order: 0,
    name: `${title}.png`,
    dataUrl: imageUrl,
    source: "upload" as const,
  };
  return {
    id,
    title,
    mode: "single",
    stack: "react-tailwind",
    device: "desktop",
    createdAt: at,
    updatedAt: at,
    status: "done",
    readOnly: true,
    messages: [
      {
        id: `${id}-m1`,
        role: "user",
        kind: "prompt",
        text: prompt,
        attachments: [attachment],
        createdAt: at,
      },
      { id: `${id}-m2`, role: "assistant", kind: "result", version: 0, createdAt: at },
    ],
    versions: [{ mode: "single", attachments: [attachment], result, createdAt: at }],
  };
}

export const SAMPLE_SESSIONS: Session[] = [
  sampleSession(
    "sample-salesforce",
    "Salesforce account record",
    "/salesforce.png",
    "Review this CRM account page — reps say it feels cluttered.",
    SALESFORCE,
  ),
  sampleSession(
    "sample-amazon",
    "Amazon homepage",
    "/amazon.jpg",
    "What's stopping shoppers from finding products here?",
    AMAZON,
  ),
];

export const getSample = (id: string) => SAMPLE_SESSIONS.find((s) => s.id === id);
