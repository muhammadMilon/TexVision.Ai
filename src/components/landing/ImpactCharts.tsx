"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, DEFECT_COLOR, INK, money, num } from "@/lib/utils";

/**
 * Landing-page impact charts for a 10-machine reference factory - the same
 * assumptions the ROI calculator below uses, so the two never disagree.
 */

const MACHINES = 10;
const METRES_PER_DAY = 1800;
const WORKING_DAYS = 300;
const FABRIC_COST = 3.1;
const WASTE_PCT = 5.4;
const REDUCTION = 0.48;

const MONTHLY_WASTE =
  (MACHINES * METRES_PER_DAY * WORKING_DAYS * (WASTE_PCT / 100) * FABRIC_COST) / 12;

/** Rollout ramp: install, calibrate, then full effect from month 5. */
const RAMP = [0, 0.15, 0.45, 0.8, 1, 1, 1, 1, 1, 1, 1, 1];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WASTE_SERIES = MONTHS.map((label, i) => ({
  label,
  without: Math.round(MONTHLY_WASTE),
  with: Math.round(MONTHLY_WASTE * (1 - REDUCTION * RAMP[i])),
}));

const ROOT_CAUSES = [
  { cause: "Broken needle", share: 31, defect: "Hole" },
  { cause: "Yarn tension drift", share: 22, defect: "Yarn Break" },
  { cause: "Over-oiled cam track", share: 17, defect: "Oil Stain" },
  { cause: "Worn sinker", share: 13, defect: "Knitting Irregularity" },
  { cause: "Dye lot change", share: 10, defect: "Colour Shift" },
  { cause: "Upstream yarn quality", share: 7, defect: "Slub" },
];

/* ------------------------------------------------------------------ tooltip */

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function Tip({
  active,
  payload,
  label,
  prefix,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/12 bg-[#0a1a2a]/97 px-3 py-2.5 shadow-2xl backdrop-blur">
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: p.color }}
              aria-hidden
            />
            <span className="text-slate-300">{p.name}</span>
            <span className="ml-auto font-mono font-semibold text-white">
              {prefix}
              {typeof p.value === "number" ? num(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const axisProps = {
  stroke: "rgba(255,255,255,0.10)",
  tick: { fill: INK.muted, fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

/* -------------------------------------------------------------------- charts */

export function ImpactCharts() {
  const yearWithout = WASTE_SERIES.reduce((s, r) => s + r.without, 0);
  const yearWith = WASTE_SERIES.reduce((s, r) => s + r.with, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      {/* ------------------------------------------- monthly waste, two series */}
      <div className="rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[15px] font-semibold text-white">
              Fabric written off each month
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              A 10-machine knitting floor, 1,800 m per machine per day, fabric at $3.10/m. The gap
              between the two lines is the money the system returns.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold tracking-tight text-teal">
              {money(yearWithout - yearWith)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              recovered in year one
            </p>
          </div>
        </div>

        <div className="mt-4 h-[268px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WASTE_SERIES} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={INK.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis
                {...axisProps}
                width={54}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                content={<Tip prefix="$" />}
                cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: INK.secondary, paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="without"
                name="Without TexVision"
                stroke={CHART_COLORS[3]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: INK.surface, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="with"
                name="With TexVision"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: INK.surface, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
          Months 1–4 are install and calibration — the benefit ramps in rather than switching on.
        </p>
      </div>

      {/* --------------------------------------------- root causes, single series */}
      <div className="rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5">
        <h3 className="font-display text-[15px] font-semibold text-white">
          What actually causes the defects
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Share of logged defects traced to each machine fault. Naming the cause is what turns a
          detection into a repair.
        </p>

        <div className="mt-4 h-[268px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ROOT_CAUSES}
              layout="vertical"
              margin={{ top: 4, right: 34, left: 4, bottom: 0 }}
            >
              <CartesianGrid stroke={INK.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v: number) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="cause"
                {...axisProps}
                width={132}
                tick={{ fill: INK.secondary, fontSize: 11 }}
              />
              <Tooltip
                content={<Tip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="share" name="Share of defects" radius={[0, 4, 4, 0]} barSize={16}>
                {ROOT_CAUSES.map((r) => (
                  <Cell key={r.cause} fill={DEFECT_COLOR[r.defect] ?? CHART_COLORS[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
          Colour matches the defect class each fault produces, so this chart and the gallery above
          read as one picture.
        </p>
      </div>
    </div>
  );
}
