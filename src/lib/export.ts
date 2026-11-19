import type { AnalysisResult, UXFix } from "./mock-data";
import type { FlowAnalysisResult, FlowScreen } from "./flow-types";
import { FLOW_ISSUE_CATEGORY_LABELS } from "./flow-types";
import type { SessionVersion } from "./session-types";
import { learnFor, principlesIn, resourceMeta } from "./learn";

// PDF / Markdown export for a session version. Shared by the session top
// bar's Export menu (and formerly duplicated inside ResultsView and
// FlowResultsView).

interface ExportMeta {
  title: string;
  stack: string;
  device: string;
}

export function screenLabeler(screens: FlowScreen[]) {
  const ordered = [...screens].sort((a, b) => a.order - b.order);
  const ordinalById = new Map(ordered.map((s, i) => [s.id, i + 1]));
  return (anchorScreenIds: string[]) => {
    if (anchorScreenIds.length === 0) return "Whole flow";
    const ordinals = anchorScreenIds.map((id) => ordinalById.get(id) ?? "?");
    return `Screen ${ordinals.join(" → ")}`;
  };
}

/** Flow results have no consolidated prompt from the model, so build one from the per-finding prompts. */
export function flowConsolidatedPrompt(result: FlowAnalysisResult, screens: FlowScreen[]): string {
  const labelFor = screenLabeler(screens);
  const high = result.findings.filter((f) => f.severity === "high" && f.fixPrompt?.trim());
  const picked = high.length > 0 ? high : result.findings.filter((f) => f.fixPrompt?.trim());
  if (picked.length === 0) return "";
  return (
    `Fix these UX issues in this user flow:\n\n` +
    picked.map((f, i) => `${i + 1}. ${labelFor(f.anchorScreenIds)} — ${f.fixPrompt}`).join("\n") +
    `\n\nKeep the existing layout and design tokens; change only what these fixes need.`
  );
}

/** "Learn more" for one issue: its principle's first article (lib/learn.ts). */
function learnLink(f: { principle?: string; principleKey?: string }): string {
  const p = learnFor(f);
  const r = p && (p.resources.find((x) => x.kind !== "video") ?? p.resources[0]);
  return p && r ? `[${p.name}](${r.url}) (${resourceMeta(r)})` : "";
}

/** The "Keep learning" list at the end: every principle, with all its resources. */
function learningMarkdown(items: { principle?: string; principleKey?: string }[]): string {
  const ps = principlesIn(items);
  if (!ps.length) return "";
  return (
    `\n\n## Keep learning\n\n` +
    ps
      .map(
        (p) =>
          `**${p.name}**: ${p.idea}\n` +
          p.resources
            .map((r) => `- [${r.title}](${r.url}) · ${r.source} · ${resourceMeta(r)}`)
            .join("\n"),
      )
      .join("\n\n")
  );
}

function fixBlock(f: UXFix, i: number, heading: string) {
  const learn = learnLink(f);
  return (
    `## ${i + 1}. ${f.title} [${f.severity}]${heading}\n**${f.principle}**\n\n${f.problem}\n\n*Why:* ${f.why}\n\n*Fix:* ${f.solution}` +
    (learn ? `\n\n*Learn more:* ${learn}` : "") +
    (f.fixPrompt?.trim() ? `\n\n*Fix prompt:*\n\n> ${f.fixPrompt}` : "") +
    (f.code?.trim() ? `\n\n\`\`\`${f.language}\n${f.code}\n\`\`\`` : "")
  );
}

export function versionMarkdown(version: SessionVersion, meta: ExportMeta): string {
  if (version.mode === "single") {
    const r: AnalysisResult = version.result;
    const wins = r.wins ?? [];
    return (
      `# ${meta.title} — What's off, by Dats Off.\n\nScore: ${r.score}/100 · ${meta.stack} · ${meta.device}\n\n${r.summary}\n\n` +
      r.fixes.map((f, i) => fixBlock(f, i, "")).join("\n\n") +
      (wins.length
        ? `\n\n## What you got right\n\n` +
          wins.map((w) => `- **${w.title}** (${w.principle}): ${w.explanation}`).join("\n")
        : "") +
      (r.consolidatedFixPrompt?.trim()
        ? `\n\n## Fix everything at once\n\n\`\`\`\n${r.consolidatedFixPrompt}\n\`\`\``
        : "") +
      learningMarkdown([...r.fixes, ...wins])
    );
  }
  const r = version.result;
  const labelFor = screenLabeler(version.attachments);
  return (
    `# ${meta.title} — What's off in this flow, by Dats Off.\n\nFlow score: ${r.flowScore}/100 · Goal achieved: ${r.goalAchieved} · ${meta.stack} · ${meta.device}\n\n${r.summary}\n\n` +
    r.findings
      .map((f, i) =>
        fixBlock(
          f,
          i,
          ` — ${labelFor(f.anchorScreenIds)} · ${FLOW_ISSUE_CATEGORY_LABELS[f.category]}`,
        ),
      )
      .join("\n\n") +
    learningMarkdown(r.findings)
  );
}

export async function exportVersionPDF(version: SessionVersion, meta: ExportMeta) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  let y = margin;

  const write = (
    text: string,
    size: number,
    style: "normal" | "bold" | "italic",
    color: number,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, 500);
    const lh = size * 1.3;
    if (y + lines.length * lh > 790) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * lh + 4;
  };

  const flow = version.mode === "flow";
  const labelFor = screenLabeler(version.attachments);
  write(`${meta.title} — ${flow ? "What's off in this flow" : "What's off"}`, 20, "bold", 20);
  write(
    flow
      ? `Flow score ${version.result.flowScore}/100 · Goal achieved: ${version.result.goalAchieved} · ${meta.stack} · ${meta.device}`
      : `Score ${version.result.score}/100 · ${meta.stack} · ${meta.device}`,
    11,
    "normal",
    110,
  );
  write(version.result.summary, 11, "normal", 60);
  y += 8;

  const fixes: (UXFix & { anchor?: string })[] =
    version.mode === "flow"
      ? version.result.findings.map((f) => ({ ...f, anchor: labelFor(f.anchorScreenIds) }))
      : version.result.fixes;

  fixes.forEach((fix, i) => {
    write(
      `${i + 1}. [${fix.severity.toUpperCase()}] ${fix.title}${fix.anchor ? ` — ${fix.anchor}` : ""}`,
      13,
      "bold",
      20,
    );
    write(`Principle: ${fix.principle}`, 10, "italic", 110);
    write(`Problem: ${fix.problem}`, 10, "normal", 40);
    write(`Why: ${fix.why}`, 10, "normal", 40);
    write(`Solution: ${fix.solution}`, 10, "normal", 40);
    if (fix.fixPrompt?.trim()) write(`Fix prompt: ${fix.fixPrompt}`, 10, "normal", 70);
    const p = learnFor(fix);
    const r = p && (p.resources.find((x) => x.kind !== "video") ?? p.resources[0]);
    if (p && r) write(`Learn more: ${p.name}, ${r.url}`, 9, "normal", 110);
    y += 8;
  });

  const wins = version.mode === "single" ? (version.result.wins ?? []) : [];
  const learning = principlesIn([...fixes, ...wins]);
  if (learning.length) {
    y += 8;
    write("Keep learning", 13, "bold", 20);
    for (const p of learning) {
      write(`${p.name}: ${p.idea}`, 10, "bold", 40);
      for (const r of p.resources)
        write(`${r.title} (${r.source}, ${resourceMeta(r)}): ${r.url}`, 9, "normal", 110);
      y += 4;
    }
  }

  doc.save(`${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "dats-off"}-whats-off.pdf`);
}
