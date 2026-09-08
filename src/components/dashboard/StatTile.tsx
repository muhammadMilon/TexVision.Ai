"use client";

import { motion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/charts";
import { CHART_COLORS, cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaGoodWhenDown = true,
  hint,
  spark,
  accent = CHART_COLORS[0],
  index = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaGoodWhenDown?: boolean;
  hint?: string;
  spark?: { v: number }[];
  accent?: string;
  index?: number;
}) {
  const good = delta === undefined ? null : deltaGoodWhenDown ? delta <= 0 : delta >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5"
    >
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[28px] font-bold leading-none tracking-tight text-white">
          {value}
        </span>
        {unit ? <span className="text-sm font-medium text-slate-400">{unit}</span> : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              good
                ? "border-teal/30 bg-teal/10 text-teal"
                : "border-[#e05c68]/30 bg-[#e05c68]/10 text-[#f08a94]",
            )}
          >
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        ) : null}
        {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
      </div>

      {spark ? (
        <div className="mt-3 -mx-1">
          <Sparkline data={spark} color={accent} />
        </div>
      ) : null}
    </motion.div>
  );
}
