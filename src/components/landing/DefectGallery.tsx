"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DEFECT_COLOR } from "@/lib/utils";

/**
 * The six defect classes, drawn rather than described.
 *
 * Each card renders a CSS fabric swatch with a characteristic flaw painted on
 * it; the detector box sweeps the row one card at a time so a visitor can see
 * what a detection actually looks like. Everything is deterministic.
 */

type Klass = {
  name: string;
  blurb: string;
  cause: string;
  accuracy: number;
  /** The flaw itself, drawn on the swatch. */
  flaw: React.CSSProperties;
  /** Optional second element for flaws that need two marks. */
  flaw2?: React.CSSProperties;
};

const CLASSES: Klass[] = [
  {
    name: "Hole",
    blurb: "Broken loop leaves an open gap in the knit.",
    cause: "Broken or bent needle",
    accuracy: 98.1,
    flaw: {
      left: "44%",
      top: "38%",
      width: 22,
      height: 16,
      borderRadius: "50%",
      background: "radial-gradient(circle, #04101a 45%, #0a1c2b 100%)",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.7), inset 0 0 6px #000",
    },
  },
  {
    name: "Yarn Break",
    blurb: "A course stops mid-row and the line of loops fails.",
    cause: "Yarn tension too high",
    accuracy: 96.4,
    flaw: {
      left: "18%",
      top: "47%",
      width: "46%",
      height: 3,
      background: "linear-gradient(90deg, transparent, #05121d 18%, #05121d 82%, transparent)",
    },
    flaw2: {
      left: "62%",
      top: "40%",
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "transparent",
      border: "2px solid rgba(5,18,29,0.85)",
    },
  },
  {
    name: "Oil Stain",
    blurb: "Lubricant transfers from the cylinder onto the web.",
    cause: "Over-oiled cam track",
    accuracy: 97.3,
    flaw: {
      left: "40%",
      top: "30%",
      width: 34,
      height: 26,
      borderRadius: "48% 52% 40% 60%",
      background: "radial-gradient(circle at 40% 40%, rgba(20,14,4,0.92), rgba(38,28,8,0.35) 70%, transparent)",
      filter: "blur(0.4px)",
    },
  },
  {
    name: "Colour Shift",
    blurb: "A band of the roll drifts off the approved shade.",
    cause: "Dye lot / batch change",
    accuracy: 93.8,
    flaw: {
      left: "52%",
      top: 0,
      width: "34%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(122,98,211,0.34) 30%, rgba(122,98,211,0.34) 70%, transparent)",
      mixBlendMode: "screen",
    },
  },
  {
    name: "Knitting Irregularity",
    blurb: "Loop density changes and the fabric shows a track mark.",
    cause: "Worn sinker / cam timing",
    accuracy: 91.7,
    flaw: {
      left: "30%",
      top: 0,
      width: 26,
      height: "100%",
      background:
        "repeating-linear-gradient(0deg, rgba(5,18,29,0.55) 0 3px, transparent 3px 6px)",
    },
  },
  {
    name: "Slub",
    blurb: "A thick lump of yarn rides into the fabric face.",
    cause: "Yarn quality upstream",
    accuracy: 94.9,
    flaw: {
      left: "34%",
      top: "44%",
      width: "30%",
      height: 7,
      borderRadius: 4,
      background: "linear-gradient(90deg, transparent, #6d8798 25%, #90a9b8 50%, #6d8798 75%, transparent)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
    },
  },
];

export function DefectGallery() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActive((a) => (a + 1) % CLASSES.length), 1900);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLASSES.map((c, i) => {
          const color = DEFECT_COLOR[c.name] ?? "#00ab95";
          const isActive = i === active;
          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
              className="overflow-hidden rounded-2xl border bg-[#0e2033]/70 transition-colors duration-500"
              style={{ borderColor: isActive ? color + "88" : "rgba(255,255,255,0.10)" }}
            >
              {/* the swatch */}
              <div className="fabric-weave relative h-32 overflow-hidden border-b border-white/8">
                <span className="absolute" style={c.flaw} />
                {c.flaw2 ? <span className="absolute" style={c.flaw2} /> : null}

                {/* sweep, only on the active card */}
                {isActive ? (
                  <div className="animate-sweep pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_35%,rgba(110,241,221,0.16)_50%,transparent_65%)]" />
                ) : null}

                {/* detection box */}
                <motion.div
                  className="absolute rounded-[3px] border-2"
                  style={{
                    left: "22%",
                    top: "18%",
                    width: "56%",
                    height: "62%",
                    borderColor: color,
                    boxShadow: `0 0 18px ${color}66`,
                  }}
                  animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.9 }}
                  transition={{ duration: 0.28 }}
                >
                  <span
                    className="absolute -top-[19px] left-0 whitespace-nowrap rounded-t-[3px] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#06131c]"
                    style={{ background: color }}
                  >
                    {c.name} {c.accuracy.toFixed(1)}%
                  </span>
                </motion.div>
              </div>

              {/* the read-out */}
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-[15px] font-semibold text-white">{c.name}</h3>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: color }}
                    aria-hidden
                  />
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{c.blurb}</p>

                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Usual cause
                </p>
                <p className="text-[12.5px] font-medium text-slate-200">{c.cause}</p>

                {/* per-class detection rate */}
                <div className="mt-3.5">
                  <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="text-slate-500">Detection rate</span>
                    <span className="font-semibold text-white">{c.accuracy}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.accuracy}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-wider text-slate-500">
        Swatches are illustrative · detection rates from lab validation on MVTec AD + TILDA
      </p>
    </div>
  );
}
