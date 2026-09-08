/**
 * Dummy "AI" layer.
 *
 * There is no model behind any of this - every function is deterministic
 * logic over the local dummy dataset. The point is that the *workflow* is
 * complete: an inference stream, a root-cause engine, a report writer and a
 * question-answering assistant, all wired to the same data the dashboard
 * shows.
 */
import { defectsByMachine, defectsByType, inRangeDays, kpis, rootCauseFindings, wasteModel } from "./analytics";
import { ROOT_CAUSES } from "./seed";
import type { Defect, DefectType, IotDevice, Machine, QcReport, Severity } from "./types";
import { money, num } from "./utils";

/* ------------------------------------------------------ live inference sim */

export interface LiveDetection {
  id: string;
  type: DefectType;
  severity: Severity;
  confidence: number;
  /** normalised box, 0-1 within the viewport */
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
}

const TYPES: DefectType[] = [
  "Hole", "Yarn Break", "Oil Stain", "Colour Shift", "Knitting Irregularity", "Slub", "Misalignment",
];

export function simulateDetection(sensitivity: number): LiveDetection | null {
  // sensitivity 0-100 -> chance a frame carries a defect
  if (Math.random() > 0.16 + sensitivity / 500) return null;

  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const roll = Math.random();
  const severity: Severity = roll > 0.82 ? "Critical" : roll > 0.45 ? "Major" : "Minor";
  const w = 0.06 + Math.random() * 0.16;
  const h = 0.07 + Math.random() * 0.15;

  return {
    id: `LD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    severity,
    confidence: +(0.68 + Math.random() * 0.31).toFixed(3),
    x: Math.random() * (1 - w),
    y: Math.random() * (1 - h),
    w,
    h,
    at: Date.now(),
  };
}

export function inferRootCause(type: DefectType) {
  const options = ROOT_CAUSES[type];
  return options[Math.floor(Math.random() * options.length)];
}

/* ------------------------------------------------------- report generation */

export interface ReportDraft {
  summary: string;
  pointsPer100m: number;
  verdict: "Pass" | "Fail" | "Conditional";
  wasteMeters: number;
  costImpactUsd: number;
  defectCount: number;
  inspectedMeters: number;
}

/** ASTM D5430 four-point scale, applied to the defect's longest dimension. */
function fourPointScore(d: Defect) {
  const cm = Math.max(d.lengthCm, d.widthCm);
  if (d.type === "Hole" && cm > 2.5) return 4;
  if (cm <= 7.6) return 1;
  if (cm <= 15.2) return 2;
  if (cm <= 22.9) return 3;
  return 4;
}

export function generateReportDraft(
  defects: Defect[],
  machines: Machine[],
  lineId: string,
  days: number,
  aql: string,
): ReportDraft {
  const scoped = inRangeDays(defects, days).filter((d) => lineId === "all" || d.lineId === lineId);
  const lineMachines = machines.filter((m) => lineId === "all" || m.lineId === lineId);
  const inspectedMeters = Math.round(
    lineMachines.reduce((s, m) => s + m.totalMetersToday, 0) * days * 0.92,
  );
  const points = scoped.reduce((s, d) => s + fourPointScore(d), 0);
  const pointsPer100m = inspectedMeters ? +((points / inspectedMeters) * 100).toFixed(1) : 0;
  const wasteMeters = +scoped.reduce((s, d) => s + d.fabricLossMeters, 0).toFixed(1);
  const costImpactUsd = +scoped.reduce((s, d) => s + d.costImpactUsd, 0).toFixed(2);

  const threshold = aql === "1.5" ? 15 : aql === "2.5" ? 20 : 28;
  const verdict: ReportDraft["verdict"] =
    pointsPer100m <= threshold * 0.8 ? "Pass" : pointsPer100m <= threshold ? "Conditional" : "Fail";

  const byType = defectsByType(scoped);
  const top = byType[0];
  const byMachine = defectsByMachine(scoped, lineMachines);
  const worst = byMachine[0];
  const findings = rootCauseFindings(scoped, lineMachines);

  const parts: string[] = [];
  parts.push(
    `Across ${num(inspectedMeters)} m inspected over ${days} day(s), TexVision AI recorded ${num(
      scoped.length,
    )} defects, scoring ${pointsPer100m} points per 100 m against an AQL ${aql} threshold of ${threshold} - verdict: ${verdict}.`,
  );
  if (top) {
    parts.push(
      `${top.type} is the dominant class at ${Math.round(
        (top.count / Math.max(1, scoped.length)) * 100,
      )}% of all detections (${top.count} events, ${top.waste} m of fabric loss).`,
    );
  }
  if (worst) {
    parts.push(
      `${worst.machine} carries the highest defect load (${worst.count} events, ${money(
        worst.cost,
      )} estimated impact) and is running at a health score of ${worst.health}/100.`,
    );
  }
  if (findings[0]) {
    parts.push(
      `Root-cause clustering attributes ${Math.round(findings[0].share * 100)}% of ${
        findings[0].machineName
      } defects to "${findings[0].cause}". Recommended action: ${findings[0].recommendation}`,
    );
  }
  parts.push(
    `Total measured fabric loss for the period is ${wasteMeters} m (${money(
      costImpactUsd,
      2,
    )}). Continuous inspection coverage was maintained on-device; no video left the factory network.`,
  );

  return {
    summary: parts.join(" "),
    pointsPer100m,
    verdict,
    wasteMeters,
    costImpactUsd,
    defectCount: scoped.length,
    inspectedMeters,
  };
}

export function reportToText(r: QcReport, lineName: string) {
  return [
    "TEXVISION AI - AUTOMATED QUALITY CONTROL REPORT",
    "=".repeat(52),
    `Report ID     : ${r.id}`,
    `Title         : ${r.title}`,
    `Buyer         : ${r.buyer}`,
    `Line          : ${lineName}`,
    `Period        : ${r.periodFrom} to ${r.periodTo}`,
    `AQL level     : ${r.aqlLevel}`,
    `Prepared by   : ${r.author}`,
    `Status        : ${r.status}`,
    "",
    "RESULTS",
    "-".repeat(52),
    `Inspected        : ${num(r.inspectedMeters)} m`,
    `Defects recorded : ${num(r.defectCount)}`,
    `Points / 100 m   : ${r.pointsPer100m}`,
    `Fabric loss      : ${r.wasteMeters} m`,
    `Cost impact      : ${money(r.costImpactUsd, 2)}`,
    `Verdict          : ${r.verdict.toUpperCase()}`,
    "",
    "AI SUMMARY",
    "-".repeat(52),
    r.summary,
    "",
    "Generated by TexVision AI edge inspection system.",
    "Detection performed on-device; only defect metadata was synced.",
  ].join("\n");
}

/* ------------------------------------------------------------- assistant */

interface AssistantCtx {
  defects: Defect[];
  machines: Machine[];
  devices: IotDevice[];
}

/** Keyword-routed answers over the live dummy dataset. */
export function answerQuestion(question: string, ctx: AssistantCtx): string {
  const q = question.toLowerCase();
  const { defects, machines, devices } = ctx;
  const k = kpis(defects, machines, devices);

  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has("hello", "hi ", "salam", "assalam", "hey")) {
    return "Assalamu alaikum. I am the TexVision assistant. Ask me about defect trends, machine health, waste cost, root causes, IoT device status or report generation - I read directly from the live inspection data.";
  }

  if (has("worst", "which machine", "problem machine", "machine health")) {
    const ranked = defectsByMachine(inRangeDays(defects, 7), machines);
    const w = ranked[0];
    const best = ranked[ranked.length - 1];
    return `Over the last 7 days ${w.machine} (${w.id}) is the worst performer: ${w.count} defects, ${w.waste} m of fabric loss, ${money(
      w.cost,
    )} impact, health score ${w.health}/100. The cleanest machine is ${best.machine} with ${best.count} defects. I would prioritise a needle-bed and cam inspection on ${w.id} at the next roll change.`;
  }

  if (has("root cause", "why", "reason", "cause")) {
    const f = rootCauseFindings(inRangeDays(defects, 7), machines);
    if (!f.length) return "Not enough clustered evidence in the last 7 days to name a root cause yet.";
    return f
      .slice(0, 3)
      .map(
        (x, i) =>
          `${i + 1}. ${x.machineName} - "${x.cause}" explains ${Math.round(
            x.share * 100,
          )}% of its ${x.defectType} defects (${x.occurrences} events, ${Math.round(
            x.confidence * 100,
          )}% confidence). Action: ${x.recommendation}`,
      )
      .join("\n\n");
  }

  if (has("waste", "loss", "cost", "money", "saving", "roi")) {
    const w = wasteModel(defects, machines);
    return `In the last 14 days the system measured ${w.wasteMeters.toFixed(
      1,
    )} m of fabric loss, worth about ${money(w.wasteCost)}. Annualised, the defects TexVision currently catches represent ${money(
      w.detectedYearlyCost,
    )} of material. Moving the plant from a ${w.baselineWastePct}% baseline waste rate to the ${w.targetWastePct}% target is worth roughly ${money(
      w.avoidableYearlyCost,
    )} per year at ${money(3.1, 2)}/m fabric cost.`;
  }

  if (has("device", "iot", "camera", "jetson", "hardware", "sensor", "offline")) {
    const off = devices.filter((d) => d.status !== "Online");
    const lines = off.map((d) => `- ${d.name} (${d.hardware}) is ${d.status}: ${d.notes}`).join("\n");
    return `${k.devicesOnline}/${k.devicesTotal} IoT devices are online, average inference latency ${k.avgLatency.toFixed(
      0,
    )} ms.${off.length ? `\n\nNeeds attention:\n${lines}` : " All nodes are healthy."}`;
  }

  if (has("trend", "today", "last 24", "how many", "count", "summary", "status")) {
    return `Last 24 hours: ${k.defects24} defects detected (${
      k.defectsDelta >= 0 ? "+" : ""
    }${k.defectsDelta.toFixed(1)}% vs the previous day), ${k.critical} of them critical. ${num(
      k.metersToday,
    )} m of fabric was inspected, giving a defect rate of ${k.defectRate.toFixed(
      2,
    )} per 100 m. Measured fabric loss ${k.wasteMeters.toFixed(1)} m (${money(
      k.costUsd,
      2,
    )}). Mean detection confidence ${(k.avgConfidence * 100).toFixed(1)}%.`;
  }

  if (has("report", "aql", "buyer", "audit", "compliance")) {
    return "I can draft a buyer-ready QC report. Open Reports, choose a line, period and AQL level, then press Generate with AI - the draft applies the four-point (ASTM D5430) scoring rule to every detection, writes the summary and sets a Pass / Conditional / Fail verdict you can edit before sending.";
  }

  if (has("hole", "yarn", "stain", "colour", "color", "slub", "defect type")) {
    const t = defectsByType(inRangeDays(defects, 7));
    return `Defect mix over 7 days:\n${t
      .map((x) => `- ${x.type}: ${x.count} events, ${x.waste} m lost, ${money(x.cost)}`)
      .join("\n")}`;
  }

  if (has("accuracy", "model", "precision", "recall", "confidence")) {
    return "The deployed detector is a YOLOv10-nano fine-tuned on MVTec AD + TILDA plus in-house annotations: 96.4% detection accuracy, 94.2% precision, 91.7% recall in lab validation, running at 38 ms per frame on a Jetson Orin Nano. Live mean confidence right now is " +
      `${(k.avgConfidence * 100).toFixed(1)}%.`;
  }

  if (has("shift", "operator", "night")) {
    return "Shift C (22:00-06:00) consistently carries the highest defect load - the pattern matches the fatigue window that motivated the project. Open Analytics to compare shift-by-shift counts and critical share.";
  }

  return `I did not match that to a specific query, but here is where things stand: ${k.defects24} defects in the last 24 h, ${k.critical} critical, ${k.devicesOnline}/${k.devicesTotal} devices online, ${money(
    k.costUsd,
    2,
  )} of measured impact. Try asking about "worst machine", "root cause", "waste cost", "device status", "defect types" or "model accuracy".`;
}

export const SUGGESTED_QUESTIONS = [
  "Which machine is performing worst this week?",
  "What is the root cause of the recent defects?",
  "How much fabric waste and cost did we record?",
  "Are all IoT devices online?",
  "Give me a status summary for the last 24 hours",
  "What is the model accuracy?",
];
