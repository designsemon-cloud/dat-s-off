import { createServerFn } from "@tanstack/react-start";
import { store } from "./auth";
import type { FeedbackEntry, FeedbackInput } from "@/lib/feedback-types";

// In-app feedback, kept in the app's KV store (Upstash Redis in production):
// one key per entry and an index of ids, newest first. Read on the private
// /admin/feedback page, which needs FEEDBACK_ADMIN_KEY.

const INDEX = "feedback:ids";
const MAX_TEXT = 2000;

const clip = (s: unknown, n = MAX_TEXT) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as FeedbackInput)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const rating = Number(data.rating);
    if (!(rating >= 1 && rating <= 4)) throw new Error("Pick a rating first.");
    const kv = await store();

    // Attach the account when signed in, so we can follow up.
    let user: FeedbackEntry["user"] = null;
    if (data.sessionToken) {
      const s = await kv.get(`session:${data.sessionToken}`);
      if (s) {
        const u = await kv.get(`user:${(JSON.parse(s) as { userId: string }).userId}`);
        if (u) {
          const p = JSON.parse(u) as { id: string; email: string; name: string };
          user = { id: p.id, email: p.email, name: p.name };
        }
      }
    }

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      rating,
      helped: Array.isArray(data.helped) ? data.helped.slice(0, 10).map((h) => clip(h, 40)) : [],
      improve: clip(data.improve),
      idea: clip(data.idea),
      role: data.role ? clip(data.role, 40) : null,
      sessionId: data.sessionId ? clip(data.sessionId, 80) : null,
      mode: data.mode === "flow" || data.mode === "single" ? data.mode : null,
      score: typeof data.score === "number" ? data.score : null,
      page: clip(data.page, 200),
      user,
    };
    await kv.put(`feedback:${entry.id}`, JSON.stringify(entry));
    const ids = JSON.parse((await kv.get(INDEX)) ?? "[]") as string[];
    await kv.put(INDEX, JSON.stringify([entry.id, ...ids].slice(0, 5000)));
    return { ok: true };
  });

export const listFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { key: string })
  .handler(async ({ data }): Promise<FeedbackEntry[]> => {
    const admin = process.env["FEEDBACK_ADMIN_KEY"];
    if (!admin) throw new Error("Set FEEDBACK_ADMIN_KEY in .env.local to read feedback.");
    if (data.key !== admin) throw new Error("That key isn't right.");
    const kv = await store();
    const ids = JSON.parse((await kv.get(INDEX)) ?? "[]") as string[];
    const rows = await Promise.all(ids.slice(0, 500).map((id) => kv.get(`feedback:${id}`)));
    return rows.filter((r): r is string => !!r).map((r) => JSON.parse(r) as FeedbackEntry);
  });
