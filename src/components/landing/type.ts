// The landing page's type scale (design-system/foundations/typography.md).
// Every piece of marketing copy uses one of these roles, so importance reads
// the same in every section. Mock UI inside demo cards is exempt: it imitates
// a product screen, not the page.
//
// Three levers, used together:
//   Family + size  Forum for the display voice (H1, H2, numbers); sans for
//                  everything you read.
//   Weight         Forum has one weight, so card titles switch to sans 600 to
//                  stand apart from 400 body. Labels are 500.
//   Ink            foreground → titles and numbers; muted-foreground →
//                  ledes, body and lists; text-tertiary → labels and captions.

export const TYPE = {
  /** Hero H1. */
  hero: "font-display text-[46px] text-foreground sm:text-[72px]",
  /** Closing H2 under the final scene. */
  closing: "font-display text-[40px] text-foreground sm:text-[60px]",
  /** Section H2 (inside `Section`). */
  section: "font-display text-[34px] text-foreground sm:text-[44px]",
  /** Large statement set in display type (the "Why" scrub text). */
  statement: "font-display text-[30px] leading-[1.2] sm:text-[38px]",
  /** One-line subtitle under a display heading. */
  lede: "text-[16px] leading-[1.6] text-muted-foreground sm:text-[18px]",
  /** Card, plan, step, persona and FAQ titles. */
  title: "text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-foreground",
  /** Card descriptions and answers. */
  body: "text-[15px] leading-[1.6] text-muted-foreground",
  /** Checklists and supporting detail inside cards. */
  list: "text-[14px] leading-[1.5] text-muted-foreground",
  /** Eyebrows and small group labels. */
  label: "text-[13px] font-medium text-text-tertiary",
  /** Ordinals: "01", "Pass 1". */
  index: "text-[12px] font-medium tabular-nums text-text-tertiary",
  /** Notes under CTAs and other fine print. */
  caption: "text-[13px] text-text-tertiary",
  /** Big numbers: stats and prices. */
  number: "font-display text-[48px] leading-none text-foreground",
} as const;
