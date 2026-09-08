import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * Chart palette. Validated with the dataviz palette validator against the
 * dark chart surface #0e2033: lightness band, chroma floor, adjacent-pair CVD
 * separation, normal-vision floor and 3:1 contrast all pass. Do not hand-tune
 * these values - re-run the validator if they change.
 */
export const CHART_COLORS = [
  "#00ab95", // 1 teal
  "#c38302", // 2 amber
  "#7962d3", // 3 violet
  "#e05c68", // 4 red
  "#4385c0", // 5 blue
  "#d5734f", // 6 orange
] as const;

/** Deliberate neutral for an "Other" / rare-category bucket. */
export const OTHER_COLOR = "#8092a3";

/** Reserved status ramp - never reused as a series colour. */
export const SEVERITY_COLOR = {
  Critical: "#d04d5b",
  Major: "#c38302",
  Minor: "#00ab95",
} as const;

/** Single-hue sequential ramp, light -> dark, for magnitude encoding. */
export const SEQUENTIAL_TEAL = ["#00372e", "#005146", "#006e5f", "#008b79", "#03aa94"] as const;

/** Categorical hues assigned in fixed order - never cycled, never by rank. */
export const DEFECT_COLOR: Record<string, string> = {
  Hole: CHART_COLORS[3],
  "Yarn Break": CHART_COLORS[1],
  "Oil Stain": CHART_COLORS[2],
  "Colour Shift": CHART_COLORS[0],
  "Knitting Irregularity": CHART_COLORS[4],
  Slub: CHART_COLORS[5],
  Misalignment: OTHER_COLOR,
};

/** Axis / grid / ink tokens so text never wears a series colour. */
export const INK = {
  primary: "#e7eff4",
  secondary: "#a9bcc8",
  muted: "#7f95a7",
  grid: "rgba(255,255,255,0.06)",
  surface: "#0e2033",
} as const;

export function money(n: number, digits = 0) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function num(n: number, digits = 0) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · ${d.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function timeAgo(input: string | Date, now: Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  const mins = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Days between an ISO string and the anchor "now". */
export function daysBetween(a: string | Date, b: Date) {
  const d = typeof a === "string" ? new Date(a) : a;
  return Math.floor((b.getTime() - d.getTime()) / 86_400_000);
}

export function nextId(prefix: string, existing: { id: string }[]) {
  const nums = existing
    .map((e) => parseInt(e.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${max + 1}`;
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
