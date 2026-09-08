"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Leaf, PiggyBank, Scissors, TrendingDown } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  FABRIC_COST_PER_M, defectsByDay, defectsByMachine, defectsByType, inRangeDays, savingsProjection,
  wasteModel,
} from "@/lib/analytics";
import { ChartFrame, DefectTypeChart, SavingsChart } from "@/components/charts";
import { Card, CardHeader, Field, Input, PageHeading } from "@/components/ui";
import { DEFECT_COLOR, OTHER_COLOR, money, num } from "@/lib/utils";

export default function WastePage() {
  const { defects, machines } = useStore();
  const [fabricCost, setFabricCost] = useState(FABRIC_COST_PER_M);
  const [targetPct, setTargetPct] = useState(2.8);

  const model = useMemo(() => wasteModel(defects, machines), [defects, machines]);
  const savings = useMemo(() => savingsProjection(defects), [defects]);
  const window14 = useMemo(() => inRangeDays(defects, 14), [defects]);
  const byType = useMemo(() => defectsByType(window14), [window14]);
  const byMachine = useMemo(() => defectsByMachine(window14, machines), [window14, machines]);
  const daily = useMemo(() => defectsByDay(defects, 14), [defects]);

  const yearlyProduced = model.producedYearly;
  const baselineCost = yearlyProduced * (model.baselineWastePct / 100) * fabricCost;
  const targetCost = yearlyProduced * (targetPct / 100) * fabricCost;
  const avoidable = Math.max(0, baselineCost - targetCost);

  const worstDay = daily.reduce((a, b) => (b.waste > a.waste ? b : a), daily[0]);

  return (
    <div>
      <PageHeading
        eyebrow="Intelligence"
        title="Waste & cost estimation"
        description="Defect geometry converted into metres of unusable fabric, and metres into money. This is the number that decides whether the system is worth installing — so every assumption behind it is editable."
      />

      {/* -------------------------------------------------------- headline */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Scissors,
            label: "Measured loss — 14 days",
            value: `${model.wasteMeters.toFixed(1)} m`,
            sub: money(model.wasteMeters * fabricCost, 2),
            color: "#c38302",
          },
          {
            icon: TrendingDown,
            label: "Annualised at this rate",
            value: money(model.detectedYearly * fabricCost),
            sub: `${num(Math.round(model.detectedYearly))} m of fabric`,
            color: "#d04d5b",
          },
          {
            icon: PiggyBank,
            label: "Avoidable per year",
            value: money(avoidable),
            sub: `moving ${model.baselineWastePct}% → ${targetPct}% waste`,
            color: "#00ab95",
          },
          {
            icon: Leaf,
            label: "Fabric saved per year",
            value: `${num(Math.round(avoidable / fabricCost))} m`,
            sub: "material not dyed, finished or scrapped",
            color: "#4385c0",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5"
          >
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${s.color},transparent)` }}
            />
            <span
              className="mb-4 grid h-10 w-10 place-items-center rounded-lg"
              style={{ background: `${s.color}1f`, color: s.color }}
            >
              <s.icon size={18} />
            </span>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-2 font-display text-[26px] font-bold leading-none text-white">
              {s.value}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* -------------------------------------------------------- controls */}
      <Card className="mt-4">
        <CardHeader
          title="Assumptions"
          subtitle="Change these to match your own costing — every figure on this page recalculates."
        />
        <div className="grid gap-4 p-5 pt-4 sm:grid-cols-3">
          <Field label="Fabric cost (USD / metre)">
            <Input
              type="number"
              step="0.1"
              value={fabricCost}
              onChange={(e) => setFabricCost(Math.max(0.1, +e.target.value))}
            />
          </Field>
          <Field label="Current waste rate (%)" hint="Plant baseline before deployment">
            <Input type="number" value={model.baselineWastePct} readOnly className="opacity-70" />
          </Field>
          <Field label="Target waste rate (%)" hint="What the system is expected to achieve">
            <Input
              type="number"
              step="0.1"
              value={targetPct}
              onChange={(e) => setTargetPct(Math.max(0, +e.target.value))}
            />
          </Field>
        </div>
        <div className="mx-5 mb-5 rounded-xl border border-teal/22 bg-teal/6 p-4 text-[13px] leading-relaxed text-slate-300">
          At <b className="text-white">{num(Math.round(yearlyProduced))} m</b> produced per year,
          cutting waste from <b className="text-white">{model.baselineWastePct}%</b> to{" "}
          <b className="text-white">{targetPct}%</b> is worth{" "}
          <b className="text-teal">{money(avoidable)}</b> annually at{" "}
          <b className="text-white">{money(fabricCost, 2)}/m</b>. The heaviest single day in the
          current window was <b className="text-white">{worstDay?.label}</b> at{" "}
          <b className="text-white">{worstDay?.waste.toFixed(1)} m</b> lost.
        </div>
      </Card>

      {/* ---------------------------------------------------------- charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Cumulative cost avoided"
          caption="Value of fabric caught that a manual inspection pass would statistically have missed."
          height={280}
        >
          <SavingsChart data={savings} />
        </ChartFrame>

        <ChartFrame
          title="Where the loss comes from"
          caption="Detections by class over 14 days — the tallest bar is where a fix pays back fastest."
          height={280}
        >
          <DefectTypeChart data={byType} colorOf={(t) => DEFECT_COLOR[t] ?? OTHER_COLOR} />
        </ChartFrame>
      </div>

      {/* ----------------------------------------------------- breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cost by defect class" subtitle="14-day window" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Class", "Events", "Fabric lost", "Cost"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.map((t) => (
                  <tr key={t.type} className="border-b border-white/5">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-[3px]"
                          style={{ background: DEFECT_COLOR[t.type] ?? OTHER_COLOR }}
                        />
                        <span className="text-slate-200">{t.type}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{num(t.count)}</td>
                    <td className="px-5 py-3 font-mono text-slate-300">{t.waste} m</td>
                    <td className="px-5 py-3 font-mono font-semibold text-white">
                      {money(t.waste * fabricCost, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cost by machine" subtitle="14-day window" />
          <div className="space-y-4 p-5 pt-4">
            {byMachine.map((m) => {
              const max = Math.max(...byMachine.map((x) => x.waste), 1);
              return (
                <div key={m.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-slate-200">{m.machine}</span>
                    <span className="font-mono text-[12px] text-white">
                      {money(m.waste * fabricCost, 2)}
                      <span className="ml-2 text-slate-500">{m.waste} m</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      className="h-full rounded-full bg-[#c38302]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.waste / max) * 100}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
