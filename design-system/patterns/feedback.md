# Pattern → In-app feedback

**Files**: [`FeedbackWidget.tsx`](../../src/components/uxcc/FeedbackWidget.tsx) (mounted once in `routes/app.tsx`), [`lib/feedback-types.ts`](../../src/lib/feedback-types.ts), [`server/feedback.ts`](../../src/server/feedback.ts), admin page [`routes/admin.feedback.tsx`](../../src/routes/admin.feedback.tsx).

## Why

While people test the product, the best moment to ask is right after they've seen a review, and the most useful answer is short. So: one tap first, more only if they want to, and an easy way to answer later.

## When it appears

- **Automatically**, 1.5s after a fresh result lands on a real (non-sample) session, if this session hasn't been rated and nothing was sent in the last 12 hours.
- **On demand**: the sidebar's Feedback item (`OPEN_FEEDBACK_EVENT`, `"datsoff:feedback"`).
- Never over a modal and never on the landing page.

## Shape

A 360px card, fixed bottom-right (full width minus 24px on phones), 20px radius, hairline + soft shadow.

1. **Rating first**: "How did this review land?" plus the line "We're building this for vibe coders and devs. Tell us what to fix." Four segments: _Way off · Meh · Useful · Spot on_ (1–4). The selected one fills with the foreground colour.
2. **After a rating it opens up** (height animates):
   - "What helped?" multi-select chips: Issues it found, Fix prompts, Pinned markers, The why, Learning links, Re-check.
   - "What should we fix or add?" textarea.
   - "An idea for vibe coders and devs?" textarea (optional): features, workflows, themes they'd like covered.
   - "You are a": Vibe coder · Developer · Designer · Other.
   - **Send feedback**: the primary `GlowButton`, full width.
3. **Thanks** state: a check, "Thank you. We read every one. It shapes what we fix next." It closes itself.

## Later, not now

- **Minimise** (–): folds to an icon-only **glass FAB**: a 52px round `GlassIcon` holding `MessageSquareHeart`, the feedback icon (`FEEDBACK_ICON`), which the sidebar's Feedback item shares. There's no text: "Rate this review" is its `aria-label` and tooltip. It scales to 1.05 on hover and 0.95 on press. Click to reopen where they left off.
- **Close** (×): goes away. The FAB comes back 3 minutes later as a gentle reminder; after sending, it stays away.
- What's been rated and when lives in `localStorage` `datsoff-feedback` (per-viewer convenience only).

## Storage

- `submitFeedback` (server function) validates the rating (1–4), clips text to 2000 characters, attaches the signed-in user if there is one, and stores it in the KV store (`store()` from `server/auth.ts`): `feedback:<id>` plus a `feedback:ids` index. Without Upstash env it's in memory and lost on restart.
- **Admin**: `/admin/feedback` (noindex). It asks for `FEEDBACK_ADMIN_KEY` (server env) and keeps it in `sessionStorage`. It shows the count, the average out of 4 with a distribution bar, the most-picked "helped" chips, and every entry, newest first.

## Rules

- Never block the review: the card sits in the corner, never over the content's centre. Esc folds it to the FAB (unless a dialog is open), × closes it.
- Rating stays one tap. Don't add required fields.
- Don't ask again for a session that's been rated.
