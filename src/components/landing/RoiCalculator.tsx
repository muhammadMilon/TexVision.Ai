"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, INK, money, num } from "@/lib/utils";

/**
 * Interactive payback model. Every number is an assumption the visitor can
 * change - the point is to let a factory owner check the arithmetic
 * themselves rather than take a claim on faith.
 */
export function RoiCalculator() {
  const [machines, setMachines] = useState(10);
  const [metersPerDay, setMetersPerDay] = useState(1800);
  const [fabricCost, setFabricCost] = useState(3.1);
  const [wastePct, setWastePct] = useState(5.4);
  const [reductionPct, setReductionPct] = useState(48);

  const model = useMemo(() => {
    const workingDays = 300;
    const yearlyMeters = machines * metersPerDay * workingDays;
    const wasteMeters = yearlyMeters * (wastePct / 100);
    const wasteCost = wasteMeters * fabricCost;
    const savedCost = wasteCost * (reductionPct / 100);

    const hardware = machines * 520;           // edge node + camera + light + mount
    const install = machines * 60;
    const saasYear = machines * 32 * 12;       // per-loom licence
    const yearOneCost = hardware + install + saasYear;
    const netYearOne = savedCost - yearOneCost;
    const paybackMonths = savedCost > 0 ? (yearOneCost / (savedCost / 12)) : Infinity;

    const series = Array.from({ length: 25 }, (_, month) => ({
      month,
      label: `M${month}`,
      savings: +((savedCost / 12) * month).toFixed(0),
      cost: +(hardware + install + (saasYear / 12) * month).toFixed(0),
    }));

    return {
      yearlyMeters, wasteMeters, wasteCost, savedCost,
      hardware, install, saasYear, yearOneCost, netYearOne, paybackMonths, series,
    };
  }, [machines, metersPerDay, fabricCost, wastePct, reductionPct]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      {/* ------------------------------------------------------ inputs */}
      <div className="rounded-2xl border border-white/10 bg-[#0e2033]/80 p-6">
        <h3 className="font-display text-base font-semibold text-white">Your factory</h3>
        <p className="mt-1 text-xs text-slate-400">
          Change any assumption — the payback recalculates instantly.
        </p>

        <div className="mt-6 space-y-6">
          <Slider
            label="Inspection points (machines)" value={machines} min={1} max={60} step={1}
            onChange={setMachines} suffix=" machines"
          />
          <Slider
            label="Fabric per machine per day" value={metersPerDay} min={400} max={4000} step={100}
            onChange={setMetersPerDay} suffix=" m/day"
          />
          <Slider
            label="Fabric cost" value={fabricCost} min={1.2} max={8} step={0.1}
            onChange={setFabricCost} prefix="$" suffix="/m"
          />
          <Slider
            label="Current waste rate" value={wastePct} min={1} max={12} step={0.1}
            onChange={setWastePct} suffix="%"
          />
          <Slider
            label="Waste caught by TexVision" value={reductionPct} min={10} max={80} step={1}
            onChange={setReductionPct} suffix="%"
          />
        </div>
      </div>

      {/* ------------------------------------------------------ output */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Fabric wasted per year"
            value={money(model.wasteCost)}
            sub={`${num(Math.round(model.wasteMeters))} m at ${money(fabricCost, 2)}/m`}
            tone="danger"
          />
          <Stat
            label="Recovered per year"
            value={money(model.savedCost)}
            sub={`${reductionPct}% of current waste`}
            tone="teal"
          />
          <Stat
            label="Payback period"
            value={
              Number.isFinite(model.paybackMonths)
                ? `${model.paybackMonths.toFixed(1)} mo`
                : "—"
            }
            sub={`Year-1 cost ${money(model.yearOneCost)}`}
            tone="amber"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5">
          <h4 className="font-display text-sm font-semibold text-white">
            Cumulative recovered value vs. cumulative system cost
          </h4>
          <p className="mt-1 mb-4 text-xs text-slate-400">
            The crossing point is your break-even month. Below it you are still paying the system
            off; past it the system pays you.
          </p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={model.series} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
                <XAxis
                  dataKey="label" stroke="rgba(255,255,255,0.10)" tickLine={false} axisLine={false}
                  tick={{ fill: INK.muted, fontSize: 11 }} interval={2}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.10)" tickLine={false} axisLine={false} width={62}
                  tick={{ fill: INK.muted, fontSize: 11 }}
                  tickFormatter={(v) => `$${(v as number) >= 1000 ? `${Math.round((v as number) / 1000)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a1a2a", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, fontSize: 12,
                  }}
                  labelStyle={{ color: INK.muted }}
                  formatter={(v) => money(v as number)}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Line
                  type="monotone" dataKey="savings" name="Recovered value"
                  stroke={CHART_COLORS[0]} strokeWidth={2} dot={false}
                />
                <Line
                  type="monotone" dataKey="cost" name="System cost"
                  stroke={CHART_COLORS[3]} strokeWidth={2} strokeDasharray="5 4" dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-teal/25 bg-teal/6 p-5">
          <p className="text-sm leading-relaxed text-slate-200">
            For <b className="text-white">{machines}</b> inspection points, year-one hardware is{" "}
            <b className="text-teal">{money(model.hardware)}</b>, installation{" "}
            <b className="text-teal">{money(model.install)}</b> and software{" "}
            <b className="text-teal">{money(model.saasYear)}</b>. Against{" "}
            <b className="text-teal">{money(model.savedCost)}</b> of recovered fabric, year one nets{" "}
            <b className={model.netYearOne >= 0 ? "text-teal" : "text-[#e05c68]"}>
              {money(model.netYearOne)}
            </b>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label, value, min, max, step, onChange, prefix = "", suffix = "",
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className="font-mono text-sm font-medium text-teal">
          {prefix}
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal"
      />
    </div>
  );
}

function Stat({
  label, value, sub, tone,
}: {
  label: string; value: string; sub: string; tone: "teal" | "amber" | "danger";
}) {
  const ring = {
    teal: "border-teal/30", amber: "border-amber/30", danger: "border-[#e05c68]/30",
  }[tone];
  const ink = { teal: "text-teal", amber: "text-amber", danger: "text-[#e05c68]" }[tone];
  return (
    <motion.div
      className={`rounded-2xl border bg-[#0e2033]/80 p-4 ${ring}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold tracking-tight ${ink}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
    </motion.div>
  );
}
