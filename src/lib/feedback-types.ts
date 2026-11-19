// In-app feedback (components/uxcc/FeedbackWidget.tsx → server/feedback.ts).

export const RATINGS = [
  { value: 1, label: "Way off" },
  { value: 2, label: "Meh" },
  { value: 3, label: "Useful" },
  { value: 4, label: "Spot on" },
] as const;

export const HELPED = [
  "Issues it found",
  "Fix prompts",
  "Pinned markers",
  "The why",
  "Learning links",
  "Re-check",
] as const;

export const ROLES = ["Vibe coder", "Developer", "Designer", "Other"] as const;

export type FeedbackInput = {
  rating: number;
  helped: string[];
  improve: string;
  idea: string;
  role: string | null;
  /** Where it was given: the session it was about, if any. */
  sessionId: string | null;
  mode: "single" | "flow" | null;
  score: number | null;
  sessionToken: string | null;
  page: string;
};

export type FeedbackEntry = Omit<FeedbackInput, "sessionToken"> & {
  id: string;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
};
