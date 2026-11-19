import type { InputCheck } from "@/server/check-input";
import type { AnalysisContext, AnalysisResult } from "./mock-data";
import type { FlowAnalysisResult, FlowScreen } from "./flow-types";

export type AnalysisMode = "single" | "flow";

/** What triage inferred about the product, shown to the user to confirm or correct. */
export interface AssumedContext {
  productType: string;
  primaryUser: string;
  primaryTask: string;
}

/** Answer keys for corrections to the assumed context ("ctx.productType" etc.). */
export const CONTEXT_KEY = (field: keyof AssumedContext) => `ctx.${field}`;

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options: string[];
}

export type SessionStatus =
  | "new" // created, nothing run yet — the session page starts triage on open
  | "triaging"
  | "awaiting-answers"
  | "analyzing"
  | "replying" // answering a text follow-up about a finished critique
  | "done"
  | "error"
  | "interrupted"; // page was closed/reloaded mid-run

export type SessionMessage =
  | {
      id: string;
      role: "user";
      kind: "prompt";
      text: string;
      attachments: FlowScreen[];
      createdAt: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "questions";
      questions: ClarifyingQuestion[];
      /** Triage's assumptions, confirmed or corrected before the critique runs. */
      assumed?: AssumedContext;
      /** questionId → answer; set once submitted. */
      answers?: Record<string, string>;
      skipped?: boolean;
      createdAt: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "result";
      /** Index into Session.versions. */
      version: number;
      createdAt: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "check";
      /** What the input check found, in the user's terms, ending with the question. */
      text: string;
      /** First run: is it a UI at all. Re-check: is it the same product as the last version. */
      scope: "first" | "recheck";
      /** "retry" = they'll upload another image, "proceed" = analyze anyway. */
      choice?: "retry" | "proceed";
      /** What the check found, so going ahead anyway analyses the image as what it is. */
      finding?: Pick<InputCheck, "shows" | "previousShows" | "reason">;
      createdAt: string;
    }
  | { id: string; role: "assistant"; kind: "text"; text: string; createdAt: string }
  | { id: string; role: "assistant"; kind: "error"; text: string; createdAt: string };

interface VersionBase {
  attachments: FlowScreen[];
  createdAt: string;
  /**
   * Which version of the locate pass placed this version's markers
   * (lib/locate.ts LOCATE_VERSION). An older number re-runs it.
   */
  located?: number | boolean;
  /** Issue ids the user marked as fixed in the critique's fix plan. */
  done?: string[];
}

export type SessionVersion =
  | (VersionBase & { mode: "single"; result: AnalysisResult })
  | (VersionBase & { mode: "flow"; result: FlowAnalysisResult });

export interface Session {
  id: string;
  title: string;
  mode: AnalysisMode;
  stack: string;
  device: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  /** Context inferred by triage, merged with the user's answers. */
  context?: AnalysisContext;
  /** "Q: … A: …" lines from answered clarifying questions, sent with the analysis. */
  clarifications?: string;
  messages: SessionMessage[];
  versions: SessionVersion[];
  /** Samples are read-only and never persisted. */
  readOnly?: boolean;
}
