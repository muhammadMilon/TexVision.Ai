"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Eye, Timer } from "lucide-react";

/**
 * The core argument, animated: the same broken needle on two machines.
 *
 * Without the system the fault repeats for the whole roll and is only found at
 * the inspection table. With it, the fault is caught on the second metre and
 * the machine is stopped. Both strips run off one deterministic clock so the
 * numbers on screen always agree with the drawing - no randomness, so server
 * and client renders match.
 */

const ROLL_METRES = 340;      // length of roll the manual line finishes
const CAUGHT_AT = 1.4;        // metre where TexVision stops the machine
const FABRIC_COST = 3.1;      // USD per metre

const TICKS = 150;            // ticks to traverse the roll
const HOLD = 46;              // ticks held at the end before looping

/** Fixed defect positions - the same fault, repeating every ~12.5 m. */
const MARKS = Array.from({ length: 27 }, (_, i) => CAUGHT_AT + i * 12.5);

export function DefectRace() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t >= TICKS + HOLD ? 0 : t + 1));
    }, 42);
    return () => window.clearInterval(id);
  }, []);

  const progress = Math.min(1, tick / TICKS);
  const metre = progress * ROLL_METRES;

  const manualWasted = metre;
  const texWasted = metre >= CAUGHT_AT ? CAUGHT_AT : metre;
  const stopped = metre >= CAUGHT_AT;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e2033]/70 p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-teal">
            One broken needle · two machines · same shift
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Both machines develop the identical fault in the first metre and keep knitting. Watch
            what the fabric costs in each case.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1a29] px-3 py-2 font-mono text-xs text-slate-300">
          <Timer size={14} className="text-teal" />
          Roll position <b className="text-white">{metre.toFixed(1)} m</b>
        </div>
      </div>

      <Lane
        label="Manual inspection"
        sub="Found later, at the inspection table"
        tone="#e05c68"
        icon={<Eye size={15} />}
        metre={metre}
        marks={MARKS.filter((m) => m <= metre)}
        wasted={manualWasted}
        headPct={progress * 100}
        verdict={
          progress >= 1
            ? { text: "Caught at 340 m — the whole roll is downgraded", bad: true }
            : null
        }
      />

      <div className="my-4 h-px bg-white/8" />

      <Lane
        label="With TexVision AI"
        sub="Caught by the camera on the machine"
        tone="#00ab95"
        icon={<AlertTriangle size={15} />}
        metre={metre}
        marks={stopped ? [CAUGHT_AT] : []}
        wasted={texWasted}
        headPct={stopped ? (CAUGHT_AT / ROLL_METRES) * 100 : progress * 100}
        stopped={stopped}
        verdict={
          stopped
            ? { text: "Machine stopped at 1.4 m — needle replaced, roll saved", bad: false }
            : null
        }
      />

      {/* the money line */}
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Manual — fabric lost"
          value={`${manualWasted.toFixed(0)} m`}
          money={manualWasted * FABRIC_COST}
          tone="#e05c68"
        />
        <Stat
          label="TexVision — fabric lost"
          value={`${texWasted.toFixed(1)} m`}
          money={texWasted * FABRIC_COST}
          tone="#00ab95"
        />
        <div className="rounded-xl border border-teal/25 bg-teal/8 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-teal">
            Saved on this one fault
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white">
            ${((manualWasted - texWasted) * FABRIC_COST).toFixed(0)}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
            A single needle, on one machine, on one shift. A floor runs dozens.
          </p>
        </div>
      </div>
    </div>
  );
}

function Lane({
  label,
  sub,
  tone,
  icon,
  marks,
  wasted,
  headPct,
  stopped = false,
  verdict,
}: {
  label: string;
  sub: string;
  tone: string;
  icon: React.ReactNode;
  metre: number;
  marks: number[];
  wasted: number;
  headPct: number;
  stopped?: boolean;
  verdict: { text: string; bad: boolean } | null;
}) {
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span
            className="grid h-6 w-6 place-items-center rounded-md"
            style={{ background: tone + "22", color: tone }}
          >
            {icon}
          </span>
          {label}
          <span className="font-normal text-slate-500">· {sub}</span>
        </span>
        <span className="font-mono text-xs text-slate-400">
          defective fabric{" "}
          <b style={{ color: tone }}>{wasted < 10 ? wasted.toFixed(1) : wasted.toFixed(0)} m</b>
        </span>
      </div>

      {/* the roll */}
      <div className="fabric-weave relative h-16 overflow-hidden rounded-xl border border-white/10">
        {/* good fabric behind, ruined fabric painted in as the head advances */}
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-100 ease-linear"
          style={{ width: `${headPct}%`, background: tone + "1f" }}
        />

        {/* defect marks */}
        {marks.map((m) => (
          <span
            key={m}
            className="absolute top-1/2 h-6 w-[7px] -translate-y-1/2 rounded-[2px]"
            style={{
              left: `${(m / ROLL_METRES) * 100}%`,
              border: `1.5px solid ${tone}`,
              background: tone + "44",
              boxShadow: `0 0 10px ${tone}66`,
            }}
          />
        ))}

        {/* scan head */}
        <div
          className="absolute inset-y-0 w-px transition-[left] duration-100 ease-linear"
          style={{
            left: `${headPct}%`,
            background: stopped ? "#8092a3" : tone,
            boxShadow: `0 0 14px ${stopped ? "#8092a3" : tone}`,
          }}
        />

        {stopped ? (
          <span
            className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#04231f]"
            style={{ left: `${headPct}%`, marginLeft: 10, background: tone }}
          >
            <Ban size={11} /> Machine stopped
          </span>
        ) : null}

        {/* metre ruler */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span
            key={f}
            className="absolute bottom-1 font-mono text-[9px] text-slate-500"
            style={{ left: `calc(${f * 100}% + 4px)` }}
          >
            {Math.round(f * ROLL_METRES)}m
          </span>
        ))}
      </div>

      <div className="mt-2 h-5">
        {verdict ? (
          <p
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color: verdict.bad ? "#e05c68" : "#00ab95" }}
          >
            {verdict.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  money,
  tone,
}: {
  label: string;
  value: string;
  money: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1a29] p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tracking-tight" style={{ color: tone }}>
        {value}
      </p>
      <p className="mt-1 font-mono text-xs text-slate-300">
        ${money.toFixed(money < 100 ? 2 : 0)} of fabric
      </p>
    </div>
  );
}
