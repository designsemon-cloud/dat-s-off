import { useEffect, useState } from "react";
import { pickMarks, verifyMarks, type LocateIssue } from "@/server/locate";
import type { IssueLocator, IssueRegion } from "./mock-data";
import type { FlowFix } from "./flow-types";
import type { Session } from "./session-types";
import { sessionStore } from "./session-store";
import { extractBase64 } from "./session";
import { drawMarks, proposeBoxes, type PxBox } from "./ui-proposals";

// Runs the locate pass (server/locate.ts) for a critique version that hasn't
// had it yet: new results, and critiques made before it existed.
// 1. Detect the visible elements on the screenshot, in the browser
//    (lib/ui-proposals.ts), and number them in reading order.
// 2. Draw the numbers on zoomed, overlapping tiles and ask the model which
//    numbers each issue is about (set-of-marks: picking a label is far more
//    reliable than writing coordinates).
// 3. Verify: each pick is shown back to the model as a close-up with the
//    element outlined, and it must confirm that's the element the issue is
//    about. Only confirmed picks get a marker (their elements' own pixels);
//    an unconfirmed one, or an issue not tied to one element, gets no marker
//    and the critique says so in words, rather than pointing somewhere wrong.
// It updates the stored version in place and marks it `located`, so it runs
// once per version. Samples (read-only) are hand-placed and skipped.
// See design-system/patterns/annotation-accuracy.md.

/** Bump when the method changes, so critiques located the old way are located again. */
export const LOCATE_VERSION = 3;

/** Whether a version's markers come from the current locate pass (or were hand-placed). */
export const isGrounded = (s: Session, index: number) =>
  !!s.readOnly || s.versions[index]?.located === LOCATE_VERSION;

interface Candidate {
  id: string;
  element: string;
  marks: number[];
  region: IssueRegion;
}
type Rejected = { id: string; marks: number[]; why: string };

interface Located {
  region: IssueRegion | null;
  locator: IssueLocator;
}

/** Detection and the overview image work at this size (longer side). */
const WORK_DIM = 1600;
/** Each tile is drawn at this size (longer side), so numbers and small text stay legible. */
const TILE_DIM = 1200;
/** Most marks the model is asked to choose from on one screenshot. */
const MAX_MARKS = 220;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
}

const jpeg = (c: HTMLCanvasElement) => extractBase64(c.toDataURL("image/jpeg", 0.88));

/** Reading order: top to bottom in bands of roughly one line, then left to right. */
function readingOrder(boxes: PxBox[]) {
  const band = 14;
  return [...boxes].sort((a, b) => Math.round(a.y / band) - Math.round(b.y / band) || a.x - b.x);
}

/** Overlapping tiles covering the image: 2×2 for screens, a column of 3 for tall phone captures. */
function tilesFor(W: number, H: number) {
  if (Math.max(W, H) <= 900) return [{ x: 0, y: 0, w: W, h: H, label: "The whole screen" }];
  const tall = H > W * 1.6;
  const cols = tall ? 1 : 2;
  const rows = tall ? 3 : 2;
  const ov = 0.12;
  const tw = W / cols + (cols > 1 ? W * ov : 0);
  const th = H / rows + H * ov;
  const names = tall
    ? ["Top part", "Middle part", "Bottom part"]
    : ["Top-left part", "Top-right part", "Bottom-left part", "Bottom-right part"];
  const out: { x: number; y: number; w: number; h: number; label: string }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        x: Math.min(W - tw, Math.max(0, (W / cols) * c - (c ? W * ov : 0))),
        y: Math.min(H - th, Math.max(0, (H / rows) * r - (r ? H * ov : 0))),
        w: Math.min(tw, W),
        h: Math.min(th, H),
        label: names[out.length],
      });
  return out;
}

/** Picks that belong together: the main (first) pick plus any that sit right next to the group. */
function cluster(boxes: PxBox[], W: number, H: number) {
  if (boxes.length < 2) return boxes;
  // Parts of one row can sit far apart side by side; stacked parts sit close,
  // as close as the parts are tall (two rows of tiles, an icon over its label).
  const gapX = 0.2 * W;
  const gapY = Math.max(0.03 * H, 1.5 * Math.max(...boxes.map((b) => b.h)));
  const rest = boxes.slice(1);
  const group = [boxes[0]];
  for (let added = true; added;) {
    added = false;
    const x0 = Math.min(...group.map((b) => b.x));
    const y0 = Math.min(...group.map((b) => b.y));
    const x1 = Math.max(...group.map((b) => b.x + b.w));
    const y1 = Math.max(...group.map((b) => b.y + b.h));
    const i = rest.findIndex(
      (b) =>
        Math.max(x0 - (b.x + b.w), b.x - x1, 0) <= gapX &&
        Math.max(y0 - (b.y + b.h), b.y - y1, 0) <= gapY,
    );
    if (i >= 0) {
      group.push(...rest.splice(i, 1));
      added = true;
    }
  }
  return group;
}

/** A close-up around a region with the region outlined, for verification. */
function closeUp(work: HTMLCanvasElement, r: IssueRegion) {
  const W = work.width;
  const H = work.height;
  const px = { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H };
  // Room around it so the model sees what the element is part of.
  const pad = Math.max(px.w, px.h) * 0.9 + 40;
  const x0 = Math.max(0, px.x - pad);
  const y0 = Math.max(0, px.y - pad * 0.6);
  const x1 = Math.min(W, px.x + px.w + pad);
  const y1 = Math.min(H, px.y + px.h + pad * 0.6);
  const z = Math.min(2, 720 / Math.max(x1 - x0, y1 - y0));
  const c = document.createElement("canvas");
  c.width = Math.round((x1 - x0) * z);
  c.height = Math.round((y1 - y0) * z);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(work, x0, y0, x1 - x0, y1 - y0, 0, 0, c.width, c.height);
  ctx.strokeStyle = "#e6007a";
  ctx.lineWidth = 3;
  ctx.strokeRect((px.x - x0) * z - 3, (px.y - y0) * z - 3, px.w * z + 6, px.h * z + 6);
  return jpeg(c);
}

/** Finds each issue's element on one screenshot. null = not tied to a visible element. */
async function locateOnImage(
  dataUrl: string,
  issues: LocateIssue[],
): Promise<Map<string, Located>> {
  const img = await loadImage(dataUrl);
  // Normalised both ways: big captures down, small ones up (so tiny text separates).
  const s = Math.min(2, WORK_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(1, Math.round(img.naturalWidth * s));
  const H = Math.max(1, Math.round(img.naturalHeight * s));
  const work = document.createElement("canvas");
  work.width = W;
  work.height = H;
  const ctx = work.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);

  const boxes = readingOrder(proposeBoxes(ctx, W, H, 1, MAX_MARKS));
  const out = new Map<string, Located>();
  if (!boxes.length) return out;

  const tiles = tilesFor(W, H).map((t) => {
    const z = TILE_DIM / Math.max(t.w, t.h);
    const c = document.createElement("canvas");
    c.width = Math.round(t.w * z);
    c.height = Math.round(t.h * z);
    const tc = c.getContext("2d")!;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(work, t.x, t.y, t.w, t.h, 0, 0, c.width, c.height);
    // Every element whose centre is in this tile, numbered as on the whole screen.
    const here = boxes
      .map((b, i) => ({ b, n: i + 1 }))
      .filter(({ b }) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        return cx >= t.x && cx <= t.x + t.w && cy >= t.y && cy <= t.y + t.h;
      });
    drawMarks(
      tc,
      here.map(({ b }) => ({ x: (b.x - t.x) * z, y: (b.y - t.y) * z, w: b.w * z, h: b.h * z })),
      Math.max(1, Math.min(c.width, c.height) / 650),
      here.map(({ n }) => n),
    );
    return { label: t.label, image: jpeg(c) };
  });

  const page = jpeg(work);
  const round = async (todo: LocateIssue[], rejected?: Rejected[]) => {
    const picked = await pickMarks({
      data: { image: page, tiles, count: boxes.length, issues: todo, rejected },
    });
    const candidates: Candidate[] = [];
    for (const p of picked) {
      const chosen = cluster(p.marks.map((n) => boxes[n - 1]).filter(Boolean), W, H);
      if (!chosen.length) {
        out.set(p.id, { region: null, locator: { status: "none", element: p.element } });
        continue;
      }
      const x0 = Math.min(...chosen.map((b) => b.x));
      const y0 = Math.min(...chosen.map((b) => b.y));
      const x1 = Math.max(...chosen.map((b) => b.x + b.w));
      const y1 = Math.max(...chosen.map((b) => b.y + b.h));
      candidates.push({
        id: p.id,
        element: p.element,
        marks: p.marks,
        region: { x: x0 / W, y: y0 / H, w: (x1 - x0) / W, h: (y1 - y0) / H },
      });
    }
    if (!candidates.length) return [];
    // Verify each pick on a close-up before it's allowed to become a marker.
    const verdicts = await verifyMarks({
      data: {
        checks: candidates.map((c) => ({
          issue: todo.find((i) => i.id === c.id)!,
          element: c.element,
          image: closeUp(work, c.region),
        })),
      },
    });
    const failed: Rejected[] = [];
    for (const c of candidates) {
      const v = verdicts.find((x) => x.id === c.id);
      const ok = v?.ok === true;
      out.set(c.id, {
        region: ok ? c.region : null,
        locator: { status: ok ? "verified" : "unconfirmed", element: c.element },
      });
      if (!ok) failed.push({ id: c.id, marks: c.marks, why: v?.why || "not the right element" });
    }
    return failed;
  };

  // One more try for the picks the close-up rejected, told why they were wrong.
  const rejected = await round(issues);
  if (rejected.length)
    await round(
      issues.filter((i) => rejected.some((r) => r.id === i.id)),
      rejected,
    );
  return out;
}

const running = new Set<string>();
const failed = new Set<string>();

function toLocate(f: {
  id: string;
  title: string;
  problem: string;
  solution: string;
  location?: string;
}): LocateIssue {
  return {
    id: f.id,
    title: f.title,
    problem: f.problem,
    solution: f.solution,
    location: f.location,
  };
}

async function locateVersion(session: Session, index: number) {
  const v = session.versions[index];
  const updates = new Map<string, Located>();
  const merge = (m: Map<string, Located>) => m.forEach((r, id) => updates.set(id, r));
  if (v.mode === "single") {
    const shot = v.attachments[0];
    if (shot && v.result.fixes.length)
      merge(await locateOnImage(shot.dataUrl, v.result.fixes.map(toLocate)));
  } else {
    // Flows: per screen, for the issues anchored on it.
    for (const screen of v.attachments) {
      const here = v.result.findings.filter((f: FlowFix) => f.anchorScreenIds[0] === screen.id);
      if (here.length) merge(await locateOnImage(screen.dataUrl, here.map(toLocate)));
    }
  }
  sessionStore.update(session.id, (s) => ({
    ...s,
    versions: s.versions.map((x, i) => {
      if (i !== index) return x;
      // Every issue gets the outcome; one the pass didn't return has no marker.
      const place = <T extends { id: string; region?: IssueRegion | null }>(f: T): T => {
        const u = updates.get(f.id);
        return {
          ...f,
          region: u?.region ?? null,
          locator: u?.locator ?? { status: "unconfirmed", element: "" },
        };
      };
      const located = LOCATE_VERSION;
      return x.mode === "single"
        ? { ...x, located, result: { ...x.result, fixes: x.result.fixes.map(place) } }
        : { ...x, located, result: { ...x.result, findings: x.result.findings.map(place) } };
    }),
  }));
}

/**
 * Locates a version's issues once (per LOCATE_VERSION).
 * Returns "locating" while it runs, "failed" if it couldn't, else "done".
 */
export function useLocate(session: Session, index: number) {
  const v = session.versions[index];
  const key = `${session.id}:${index}`;
  const needed = !!v && v.located !== LOCATE_VERSION && !session.readOnly && !failed.has(key);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!needed || running.has(key)) return;
    running.add(key);
    setBusy(true);
    locateVersion(session, index)
      .catch(() => failed.add(key))
      .finally(() => {
        running.delete(key);
        setBusy(false);
      });
    // The session object changes on every store update; the key is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, needed]);
  if (busy || (needed && running.has(key)) || (needed && !failed.has(key))) return "locating";
  return failed.has(key) && v?.located !== LOCATE_VERSION ? "failed" : "done";
}
