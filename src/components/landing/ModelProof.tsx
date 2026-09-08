"use client";

import { motion } from "motion/react";

/**
 * Two pieces of evidence a judge will ask for: does the model actually work,
 * and does "real time" mean anything.
 *
 * The latency comparison is drawn on a base-10 log axis - the values span 38 ms
 * to 40 minutes, which no linear axis can show honestly - and the axis is
 * labelled with its decades so the compression is visible, not hidden.
 */

const GAUGES = [
  { label: "Detection accuracy", value: 96.4, note: "held-out validation set" },
  { label: "Precision", value: 94.2, note: "few false alarms" },
  { label: "Recall", value: 91.7, note: "few misses" },
  { label: "mAP@50", value: 92.8, note: "localisation quality" },
];

/* Inference budget - the 38 ms, broken down. */
const BUDGET = [
  { stage: "Frame capture", ms: 6, color: "#00ab95" },
  { stage: "Pre-process", ms: 4, color: "#4385c0" },
  { stage: "YOLOv10-n inference", ms: 21, color: "#7962d3" },
  { stage: "Post-process + NMS", ms: 4, color: "#c38302" },
  { stage: "Decision + relay", ms: 3, color: "#d5734f" },
];

const TOTAL_MS = BUDGET.reduce((s, b) => s + b.ms, 0);

/* Log scale: 10 ms -> 40 min. */
const LO = Math.log10(10);
const HI = Math.log10(2_400_000);
const pos = (ms: number) => ((Math.log10(ms) - LO) / (HI - LO)) * 100;

const DECADES = [
  { ms: 10, label: "10 ms" },
  { ms: 100, label: "100 ms" },
  { ms: 1_000, label: "1 s" },
  { ms: 10_000, label: "10 s" },
  { ms: 60_000, label: "1 min" },
  { ms: 600_000, label: "10 min" },
];

const TIMELINE = [
  { what: "TexVision flags the defect", ms: 38, human: "38 ms", tone: "#00ab95", good: true },
  { what: "Andon tower + machine auto-stop", ms: 400, human: "0.4 s", tone: "#00ab95", good: true },
  { what: "Operator happens to notice it", ms: 240_000, human: "~4 min", tone: "#c38302", good: false },
  { what: "Found at the inspection table", ms: 2_400_000, human: "~40 min", tone: "#e05c68", good: false },
];

export function ModelProof() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ------------------------------------------------------- gauges */}
      <div className="rounded-2xl border border-white/10 bg-[#0e2033]/70 p-6">
        <h3 className="font-display text-[15px] font-semibold text-white">
          Measured model performance
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          YOLOv10-nano fine-tuned on MVTec AD + TILDA and our own annotated fabric, scored on a
          held-out set.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {GAUGES.map((g, i) => (
            <Gauge key={g.label} {...g} delay={i * 0.12} />
          ))}
        </div>

        <div className="mt-6 grid gap-2.5 border-t border-white/8 pt-5 sm:grid-cols-2">
          {[
            ["12,400", "annotated defect instances"],
            ["6", "defect classes in production"],
            ["8.4 MB", "quantised model on the edge box"],
            ["0", "cloud calls at inference time"],
          ].map(([v, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="font-display text-base font-bold text-teal">{v}</span>
              <span className="text-[12px] text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ latency budget */}
      <div className="rounded-2xl border border-white/10 bg-[#0e2033]/70 p-6">
        <h3 className="font-display text-[15px] font-semibold text-white">
          Where the 38 milliseconds go
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          The full budget from photons to relay contact, measured on a Jetson Orin Nano.
        </p>

        {/* stacked budget bar - 2px surface gaps between segments */}
        <div className="mt-5 flex h-9 gap-[2px] overflow-hidden rounded-lg">
          {BUDGET.map((b, i) => (
            <motion.div
              key={b.stage}
              className="grid place-items-center first:rounded-l-lg last:rounded-r-lg"
              style={{ background: b.color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(b.ms / TOTAL_MS) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: "easeOut" }}
            >
              <span className="font-mono text-[10px] font-bold text-[#06131c]">{b.ms}</span>
            </motion.div>
          ))}
        </div>

        {/* legend - identity is never colour-alone */}
        <div className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {BUDGET.map((b) => (
            <div key={b.stage} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: b.color }}
                aria-hidden
              />
              <span className="text-slate-300">{b.stage}</span>
              <span className="ml-auto font-mono text-slate-400">{b.ms} ms</span>
            </div>
          ))}
          <div className="col-span-full mt-1 flex items-center gap-2 border-t border-white/8 pt-2 text-[12px]">
            <span className="font-semibold text-white">Total</span>
            <span className="ml-auto font-mono font-semibold text-teal">{TOTAL_MS} ms</span>
          </div>
        </div>

        {/* time-to-know, log axis */}
        <h4 className="mt-7 font-display text-[13.5px] font-semibold text-white">
          How long before anyone knows
        </h4>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
          Log scale — each gridline is 10× the last. Every metre knitted before the alert is fabric
          already spoiled.
        </p>

        <div className="relative mt-4">
          {/* decade gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6">
            {DECADES.map((d) => (
              <span
                key={d.ms}
                className="absolute top-0 bottom-0 w-px bg-white/8"
                style={{ left: `${pos(d.ms)}%` }}
              />
            ))}
          </div>

          <div className="relative space-y-2.5 pb-1.5">
            {TIMELINE.map((t, i) => (
              <div key={t.what}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
                  <span className={t.good ? "text-slate-200" : "text-slate-400"}>{t.what}</span>
                  <span className="shrink-0 font-mono font-semibold" style={{ color: t.tone }}>
                    {t.human}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: t.tone }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(pos(t.ms), 2)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* axis labels */}
          <div className="relative mt-1 h-4">
            {DECADES.map((d) => (
              <span
                key={d.ms}
                className="absolute font-mono text-[9.5px] text-slate-500"
                style={{ left: `${pos(d.ms)}%`, transform: "translateX(-50%)" }}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gauge({
  label,
  value,
  note,
  delay,
}: {
  label: string;
  value: number;
  note: string;
  delay: number;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="text-center">
      <div className="relative mx-auto h-[86px] w-[86px]">
        <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
          <circle cx="43" cy="43" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
          <motion.circle
            cx="43"
            cy="43"
            r={R}
            fill="none"
            stroke="#19c6ad"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            whileInView={{ strokeDashoffset: C * (1 - value / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-[17px] font-bold text-white">
          {value}%
        </span>
      </div>
      <p className="mt-2 text-[12px] font-medium leading-tight text-slate-200">{label}</p>
      <p className="mt-0.5 text-[10.5px] leading-tight text-slate-500">{note}</p>
    </div>
  );
}
