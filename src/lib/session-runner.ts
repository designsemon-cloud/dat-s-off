import { toast } from "sonner";
import { analyzeUI } from "./analyze-api";
import { analyzeFlowUI } from "./analyze-flow-api";
import { askFollowUp } from "./follow-up-api";
import { triageUI } from "./triage-api";
import { FLOW_ANALYSIS_COST, FLOW_MIN_SCREENS, SINGLE_ANALYSIS_COST } from "./pricing";
import { sessionStore } from "./session-store";
import type { AnalysisContext, PreviousCritique } from "./mock-data";
import { versionScore } from "./session-utils";
import type { AuthUser } from "./auth-types";
import type { FlowScreen } from "./flow-types";
import { CONTEXT_KEY, type AnalysisMode, type Session, type SessionMessage } from "./session-types";
import { useCredit as deductCredit } from "@/server/auth";
import { checkInput, type InputCheck } from "@/server/check-input";
import { compressImageDataUrl } from "./image-utils";
import { extractBase64, parseMimeType } from "./session";

// Drives a session through: input check + triage → (optional) clarifying
// questions → analysis → follow-ups. Re-checks go through the input check
// too: nothing is analysed, and no credit spent, until the upload is a valid
// input for the task or the user says to go ahead. Each step writes its outcome to the session store as
// chat messages, so the session page just renders whatever is stored.
//
// Credits work exactly as before the chat redesign: check before running,
// deduct only after a successful analysis, and (TEMP, this branch only) skip
// deduction entirely when nobody is signed in.

export interface RunnerAuth {
  user: AuthUser | null;
  sessionToken: string | null;
  setCredits: (credits: number) => void;
  openBuyCredits: () => void;
}

// Guards against StrictMode double-effects and double clicks starting the
// same step twice; also how the session page tells a live run from one that
// was cut off by a reload.
const inFlight = new Set<string>();
export const isRunning = (id: string) => inFlight.has(id);

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

function push(id: string, message: SessionMessage, patch: Partial<Session> = {}) {
  sessionStore.update(id, (s) => ({ ...s, ...patch, messages: [...s.messages, message] }));
}

function fallbackTitle(prompt: string, mode: AnalysisMode) {
  const words = prompt.trim().split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  return words || (mode === "flow" ? "New flow review" : "New review");
}

export function createSession(input: {
  mode: AnalysisMode;
  attachments: FlowScreen[];
  prompt: string;
  stack: string;
  device: string;
}): string {
  const id = uid();
  const at = now();
  sessionStore.create({
    id,
    title: fallbackTitle(input.prompt, input.mode),
    mode: input.mode,
    stack: input.stack,
    device: input.device,
    createdAt: at,
    updatedAt: at,
    status: "new",
    messages: [
      {
        id: uid(),
        role: "user",
        kind: "prompt",
        text: input.prompt.trim(),
        attachments: input.attachments,
        createdAt: at,
      },
    ],
    versions: [],
  });
  return id;
}

function latestAttachments(s: Session): FlowScreen[] {
  for (let i = s.messages.length - 1; i >= 0; i--) {
    const m = s.messages[i];
    if (m.kind === "prompt" && m.attachments.length > 0) return m.attachments;
  }
  return [];
}

function promptText(s: Session) {
  return s.messages
    .filter((m): m is Extract<SessionMessage, { kind: "prompt" }> => m.kind === "prompt")
    .filter((m) => m.attachments.length > 0)
    .map((m) => m.text)
    .filter(Boolean)
    .join("\n");
}

const asImage = async (url: string) => {
  const small = await compressImageDataUrl(url, { maxDim: 1024 });
  return { imageBase64: extractBase64(small), mimeType: parseMimeType(small) };
};

/**
 * Looks at what was actually uploaded before anything is analysed (server/check-input.ts):
 * first run, is it an interface; re-check, is it the same product as the last version.
 * A failed check never blocks: it returns null and the run goes on.
 */
async function runInputCheck(
  s: Session,
  attachments: FlowScreen[],
  recheck: boolean,
): Promise<InputCheck | null> {
  try {
    const shots = attachments.filter((a) => a.dataUrl.startsWith("data:")).slice(0, 6);
    if (!shots.length) return null;
    const last = recheck ? s.versions[s.versions.length - 1] : undefined;
    const prevShot = last && [...last.attachments].sort((a, b) => a.order - b.order)[0]?.dataUrl;
    return await checkInput({
      data: {
        images: await Promise.all(shots.map((a) => asImage(a.dataUrl))),
        previous: last
          ? {
              image: prevShot?.startsWith("data:") ? await asImage(prevShot) : undefined,
              title: s.title,
              productType: s.context?.productType ?? "",
              summary: last.result.summary,
            }
          : undefined,
        mode: s.mode,
        prompt: promptText(s),
      },
    });
  } catch {
    return null;
  }
}

function askAboutInput(id: string, check: InputCheck, scope: "first" | "recheck") {
  push(
    id,
    {
      id: uid(),
      role: "assistant",
      kind: "check",
      text: check.message,
      scope,
      finding: { shows: check.shows, previousShows: check.previousShows, reason: check.reason },
      createdAt: now(),
    },
    { status: "awaiting-answers" },
  );
}

export async function startSession(
  id: string,
  auth: RunnerAuth,
  { skipCheck = false }: { skipCheck?: boolean } = {},
) {
  const s = sessionStore.get(id);
  if (!s || inFlight.has(id)) return;
  inFlight.add(id);
  sessionStore.update(id, (x) => ({ ...x, status: "triaging" }));

  const [t, check] = await Promise.all([
    triageUI(latestAttachments(s), promptText(s), s.mode, s.device).catch(() => null),
    skipCheck ? null : runInputCheck(s, latestAttachments(s), false),
  ]);
  const context: AnalysisContext = {
    productType: t?.inferred.productType ?? "",
    primaryUser: t?.inferred.primaryUser ?? "",
    primaryTask: t?.inferred.primaryTask ?? "",
    focusArea: "",
    platform: s.device === "mobile" ? "mobile" : "web",
    stage: "",
  };
  const title = t?.title?.trim();
  sessionStore.update(id, (x) => ({ ...x, context, ...(title ? { title } : {}) }));
  inFlight.delete(id);

  // Not an interface, too little of one, or screens from different products: ask first.
  if (check?.verdict === "ask") {
    askAboutInput(id, check, "first");
    return;
  }

  // Show what triage assumed (and any questions) before spending a credit:
  // a wrong guess about the product makes the whole critique less accurate.
  const assumed = t?.inferred;
  const hasAssumed =
    !!assumed && !!(assumed.productType || assumed.primaryUser || assumed.primaryTask);
  if (t && (t.questions.length > 0 || hasAssumed)) {
    push(
      id,
      {
        id: uid(),
        role: "assistant",
        kind: "questions",
        questions: t.questions,
        ...(hasAssumed ? { assumed } : {}),
        createdAt: now(),
      },
      { status: "awaiting-answers" },
    );
    return;
  }
  await runAnalysis(id, auth);
}

export async function answerQuestions(
  id: string,
  messageId: string,
  answers: Record<string, string> | null,
  auth: RunnerAuth,
) {
  sessionStore.update(id, (s) => {
    let clarifications = s.clarifications ?? "";
    // Corrections to the assumed product / user / task replace triage's guesses.
    const corrected = answers
      ? (["productType", "primaryUser", "primaryTask"] as const).reduce((ctx, field) => {
          const v = answers[CONTEXT_KEY(field)]?.trim();
          return v ? { ...ctx, [field]: v } : ctx;
        }, {} as Partial<AnalysisContext>)
      : {};
    const context = s.context ? { ...s.context, ...corrected } : s.context;
    const messages = s.messages.map((m) => {
      if (m.id !== messageId || m.kind !== "questions") return m;
      if (!answers) return { ...m, skipped: true };
      clarifications = m.questions
        .filter((q) => answers[q.id]?.trim())
        .map((q) => `Q: ${q.question}\nA: ${answers[q.id].trim()}`)
        .join("\n");
      return { ...m, answers };
    });
    return { ...s, messages, clarifications, context };
  });
  await runAnalysis(id, auth);
}

export async function runAnalysis(id: string, auth: RunnerAuth) {
  const s = sessionStore.get(id);
  if (!s || inFlight.has(id)) return;

  const attachments = latestAttachments(s);
  const cost = s.mode === "flow" ? FLOW_ANALYSIS_COST : SINGLE_ANALYSIS_COST;
  if (s.mode === "flow" && attachments.length < FLOW_MIN_SCREENS) return;
  if (s.mode === "single" && attachments.length === 0) return;

  if (auth.user && auth.user.credits < cost) {
    push(
      id,
      {
        id: uid(),
        role: "assistant",
        kind: "error",
        text: `This review needs ${cost} credit${cost === 1 ? "" : "s"} and you're out. Add credits, then hit Retry.`,
        createdAt: now(),
      },
      { status: "error" },
    );
    auth.openBuyCredits();
    return;
  }

  inFlight.add(id);
  sessionStore.update(id, (x) => ({ ...x, status: "analyzing" }));

  // The user went ahead past an input check ("Compare anyway" / "Critique it
  // anyway"): analyse the image as what the check found it to be, not as the
  // product the session was about. Not left to the model: told the old
  // product's context, it critiques a text document as that product.
  const last = s.versions[s.versions.length - 1];
  const override = [...s.messages]
    .reverse()
    .find(
      (m) =>
        m.kind === "check" &&
        m.choice === "proceed" &&
        (!last || m.createdAt > last.createdAt) &&
        m.finding &&
        m.finding.reason !== "ok",
    );
  const finding = override?.kind === "check" ? override.finding : undefined;
  // Not the same product as the last version: an unrelated screen, or not a UI at all.
  const unrelated =
    !!last &&
    override?.kind === "check" &&
    override.scope === "recheck" &&
    (finding?.reason === "unrelated-to-previous" || finding?.reason === "not-ui");
  const offTopic = unrelated || finding?.reason === "not-ui";

  const notes = [
    promptText(s),
    s.clarifications,
    finding &&
      `INPUT CHECK: before this run the upload was checked${finding.shows ? ` and looks like ${finding.shows}` : ""}${
        unrelated && finding.previousShows
          ? `, not the ${finding.previousShows} critiqued before`
          : ""
      }. The user chose to go ahead anyway. Critique what is actually in this image${
        finding.reason === "not-ui"
          ? " (it may not be a software interface: judge its layout, hierarchy and readability as what it is)"
          : ""
      }. Don't describe it as a different product or invent interface elements that aren't there.`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const blank: AnalysisContext = {
    productType: "",
    primaryUser: "",
    primaryTask: "",
    focusArea: "",
    platform: s.device === "mobile" ? "mobile" : "web",
    stage: "",
  };
  const context: AnalysisContext = (!offTopic && s.context) || blank;
  // What the answer opens with, so the user can't miss that this isn't a comparison.
  const lead = !finding
    ? ""
    : unrelated
      ? `This doesn't look like an updated version of v${s.versions.length}${finding.shows ? ` (it looks like ${finding.shows})` : ""}, so I critiqued it on its own instead of comparing.`
      : finding.reason === "not-ui"
        ? `This doesn't look like a software interface${finding.shows ? ` (it looks like ${finding.shows})` : ""}, so the review covers it as it is.`
        : finding.reason === "too-little"
          ? "Only part of the interface is visible, so this critique covers just what's shown."
          : "";

  // A re-check: the run after the first compares against the previous version,
  // unless the new upload isn't the same product.
  const lastShot =
    last?.mode === "single"
      ? [...last.attachments].sort((a, b) => a.order - b.order)[0]?.dataUrl
      : undefined;
  const previous: PreviousCritique | undefined =
    last && !unrelated
      ? {
          // The previous screenshot, so the re-check compares the two images, not just a list of titles.
          image: lastShot?.startsWith("data:")
            ? await compressImageDataUrl(lastShot, { maxDim: 1280 }).catch(() => undefined)
            : undefined,
          score: versionScore(last),
          issues: (last.mode === "flow" ? last.result.findings : last.result.fixes).map((f) => ({
            id: f.id,
            title: f.title,
            severity: f.severity,
            problem: f.problem,
          })),
        }
      : undefined;

  try {
    // A short floor so the progress steps in the chat don't flash past.
    const minWait = new Promise<void>((r) => setTimeout(r, 2500));
    const call =
      s.mode === "flow"
        ? analyzeFlowUI(
            attachments,
            [
              notes,
              context.productType &&
                `Product: ${context.productType}. User: ${context.primaryUser || "unspecified"}. Main task: ${context.primaryTask || "unspecified"}.`,
            ]
              .filter(Boolean)
              .join("\n\n"),
            s.stack,
            s.device,
            previous,
          ).then((result) => ({ mode: "flow" as const, result }))
        : analyzeUI(attachments[0].dataUrl, s.stack, s.device, context, notes, previous).then(
            (result) => ({
              mode: "single" as const,
              result,
            }),
          );
    const [outcome] = await Promise.all([call, minWait]);
    if (lead) outcome.result.answer = `${lead} ${outcome.result.answer ?? ""}`.trim();

    if (auth.user && auth.sessionToken) {
      const { remainingCredits } = await deductCredit({
        data: { sessionToken: auth.sessionToken, cost },
      });
      auth.setCredits(remainingCredits);
    }

    sessionStore.update(id, (x) => {
      const version = x.versions.length;
      return {
        ...x,
        status: "done",
        versions: [...x.versions, { ...outcome, attachments, createdAt: now() }],
        messages: [
          ...x.messages,
          { id: uid(), role: "assistant", kind: "result", version, createdAt: now() },
        ],
      };
    });
  } catch (e) {
    push(
      id,
      {
        id: uid(),
        role: "assistant",
        kind: "error",
        text: e instanceof Error ? e.message : "The review failed. Please try again.",
        createdAt: now(),
      },
      { status: "error" },
    );
  } finally {
    inFlight.delete(id);
  }
}

/**
 * A message typed into a session. With screenshots attached it's a re-run on
 * the new design (a new version); text-only it's a question about the
 * current critique.
 */
export async function sendMessage(
  id: string,
  text: string,
  attachments: FlowScreen[],
  auth: RunnerAuth,
) {
  const s = sessionStore.get(id);
  if (!s || inFlight.has(id)) return;

  push(id, {
    id: uid(),
    role: "user",
    kind: "prompt",
    text: text.trim(),
    attachments,
    createdAt: now(),
  });

  if (attachments.length > 0) {
    // No critique yet (the first upload was set aside): this is a fresh start.
    if (!s.versions.length) {
      await startSession(id, auth);
      return;
    }
    // A re-check: make sure it's the same product as the last version first.
    inFlight.add(id);
    sessionStore.update(id, (x) => ({ ...x, status: "triaging" }));
    const check = await runInputCheck(sessionStore.get(id)!, attachments, true);
    inFlight.delete(id);
    if (check?.verdict === "ask") {
      askAboutInput(id, check, "recheck");
      return;
    }
    await runAnalysis(id, auth);
    return;
  }

  const latest = s.versions[s.versions.length - 1];
  if (!latest) return;

  inFlight.add(id);
  sessionStore.update(id, (x) => ({ ...x, status: "replying" }));
  const history = s.messages.flatMap((m): { role: "user" | "assistant"; text: string }[] =>
    m.kind === "text"
      ? [{ role: "assistant", text: m.text }]
      : m.kind === "prompt" && m.attachments.length === 0 && m.text
        ? [{ role: "user", text: m.text }]
        : [],
  );
  try {
    const reply = await askFollowUp(text, latest.result, history);
    push(
      id,
      { id: uid(), role: "assistant", kind: "text", text: reply, createdAt: now() },
      { status: "done" },
    );
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Couldn't answer that — try again.");
    sessionStore.update(id, (x) => ({ ...x, status: "done" }));
  } finally {
    inFlight.delete(id);
  }
}

/**
 * The user's answer to an input check: upload another image (the composer
 * opens; nothing runs until they send it) or go ahead with this one.
 */
export async function resolveCheck(
  id: string,
  messageId: string,
  choice: "retry" | "proceed",
  auth: RunnerAuth,
) {
  const m = sessionStore.get(id)?.messages.find((x) => x.id === messageId);
  if (!m || m.kind !== "check" || m.choice) return;
  sessionStore.update(id, (x) => ({
    ...x,
    ...(choice === "retry" ? { status: "done" as const } : {}),
    messages: x.messages.map((y) =>
      y.id === messageId && y.kind === "check" ? { ...y, choice } : y,
    ),
  }));
  if (choice === "retry") return;
  if (m.scope === "first") await startSession(id, auth, { skipCheck: true });
  else await runAnalysis(id, auth);
}

/** Re-runs whichever step failed or was cut off by a reload. */
export function retry(id: string, auth: RunnerAuth) {
  const s = sessionStore.get(id);
  if (!s) return;
  if (s.context) void runAnalysis(id, auth);
  else void startSession(id, auth);
}

/** Called on session open: a run that's "in progress" but not in this tab was interrupted. */
export function recoverInterrupted(id: string) {
  const s = sessionStore.get(id);
  if (!s || inFlight.has(id)) return;
  if (s.status === "triaging" || s.status === "analyzing") {
    sessionStore.update(id, (x) => ({ ...x, status: "interrupted" }));
  } else if (s.status === "replying") {
    sessionStore.update(id, (x) => ({ ...x, status: "done" }));
  }
}
