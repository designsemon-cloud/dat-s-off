# Organism → Pricing panel

## 1. Overview

**File**: `Pricing` in [`src/components/landing/Closing.tsx`](../../src/components/landing/Closing.tsx). Plans and prices mirror [`BuyCreditsModal`](../../src/components/uxcc/BuyCreditsModal.tsx); keep them in sync.

**Plans (Nov 2026):** three plans in one textured panel: **Free · Pro · Credit pack**.

- Each plan says who it's for in one plain line under its name, so there is no role picker.
- Monthly and Yearly are one plan, **Pro**, with a toggle.
- The free start is a plan of its own, not a link under the panel.

## 2. Tokens

- Panel: `Card`, `p-2 sm:p-3`, and from `lg` a grid of `1fr / 1.15fr / 1fr`.
- Featured (Pro): `rounded-2xl border-border bg-bg-tertiary shadow-sm`. Free and Credit pack sit straight on the paper. Every plan has `p-6 sm:p-7`.
- Plan name `TYPE.title`; the "For …" line `TYPE.body`. Price `TYPE.number` (Forum) + a `/month` suffix in `TYPE.caption`.
- Buttons: full width. Pro uses `CosmicButton` (the one orange CTA); the others use `SolidButton`.
- A dashed rule (`border-border-strong`) above each feature list; features are `CheckDot` + 15px foreground.

## 3. Anatomy

```
┌ Card ────────────────────────────────────────────────────────────────────────┐
│ Free                     ┌ white ─────────────────────────┐ Credit pack        │
│ For anyone trying it…    │ Pro          [Monthly|Yearly]  │ For vibe coders…   │
│ $0/to start              │ For developers and founders…   │ $5/one-time        │
│ [ Start free ■ ]         │ $10/month   (yearly: $99/year [Save $21])          │
│ - - - - - - -            │ [ Get Pro (orange) ]           │ [ Buy credits ■ ]  │
│ ✓ × 3                    │ - - - - - - - - -              │ - - - - - - -      │
│                          │ ✓ × 5                          │ ✓ × 3              │
│                          └────────────────────────────────┘                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

Below `lg` the plans stack: Free, Pro, Credit pack.

## 4. States & interactions

- **Billing toggle**: `PillTabs` (Monthly | Yearly, default Monthly) in Pro's header. Switching does three things:
  - the price rolls with a blur;
  - Yearly adds the `BeamChip` "Save $21";
  - the line changes from "For developers and founders shipping every week." to "For agencies and teams on client work all year.", and the CTA from "Get Pro" to "Go yearly".
- Start free links to `/app`. Get Pro / Go yearly and Buy credits open the buy-credits modal (`openBuyCredits`).
- Every plan header is 42px tall, so the names and lines align across plans.

## 5. Accessibility

- The toggle is a `tablist` with `aria-selected` tabs. Prices are plain text, so they read as "$10 /month".
- The black buttons invert in dark mode (`bg-foreground` is near-white).

## 6. Content guidelines

- Only real plans:
  - **Free**: 5 credits, no account and no card.
  - **Credit pack**: $5 for 10 credits, no expiry; 1 credit per screen, 3 per flow.
  - **Pro**: unlimited, $10/month or $99/year (save $21).
- Who it's for is written on each plan, vibe coders and developers first (see [`voice-and-naming.md`](../foundations/voice-and-naming.md)):
  - Free: anyone trying it;
  - Pro monthly: developers and founders;
  - Pro yearly: agencies and teams;
  - Credit pack: vibe coders who ship now and then.
- Feature lines are things the plan actually unlocks; no "priority support".

## 7. Anti-patterns

- Role tabs or pickers, or a comparison table: the line on each plan does that job.
- Showing Monthly and Yearly as two separate plans.
- A second orange button: only Pro's CTA is orange.
- A free-start link under the panel: Free is a plan.
