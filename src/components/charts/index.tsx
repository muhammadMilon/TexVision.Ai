"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, INK, SEVERITY_COLOR, cn, num } from "@/lib/utils";

/* ------------------------------------------------------------- chart shell */

export function ChartFrame({
  title,
  caption,
  children,
  height = 260,
  action,
  className,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  height?: number;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0e2033]/80 p-5 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight text-white">
            {title}
          </h3>
          {caption ? <p className="mt-1 text-xs leading-relaxed text-slate-400">{caption}</p> : null}
        </div>
        {action}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- tooltip */

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function TipBox({
  active,
  payload,
  label,
  unit,
  labelPrefix,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  unit?: string;
  labelPrefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/12 bg-[#0a1a2a]/97 px-3 py-2.5 shadow-2xl backdrop-blur">
      {label !== undefined ? (
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {labelPrefix}
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: p.color, boxShadow: `0 0 0 2px ${INK.surface}` }}
            />
            <span className="text-slate-300">{p.name}</span>
            <span className="ml-auto font-mono font-semibold text-white">
              {typeof p.value === "number" ? num(p.value, p.value % 1 ? 1 : 0) : p.value}
              {unit ? <span className="ml-0.5 text-slate-400">{unit}</span> : null}
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

const legendProps = {
  wrapperStyle: { fontSize: 12, color: INK.secondary, paddingTop: 8 },
  iconType: "circle" as const,
  iconSize: 8,
};

/* ------------------------------------------------------- defect trend area */

export function DefectTrendChart({
  data,
}: {
  data: { label: string; critical: number; major: number; minor: number }[];
}) {
  return (
    <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
      <defs>
        {(["Critical", "Major", "Minor"] as const).map((s) => (
          <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SEVERITY_COLOR[s]} stopOpacity={0.5} />
            <stop offset="100%" stopColor={SEVERITY_COLOR[s]} stopOpacity={0.02} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
      <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
      <YAxis {...axisProps} width={44} />
      <Tooltip content={<TipBox />} cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }} />
      <Legend {...legendProps} />
      <Area
        type="monotone" dataKey="minor" name="Minor" stackId="1" strokeWidth={2}
        stroke={SEVERITY_COLOR.Minor} fill="url(#grad-Minor)"
      />
      <Area
        type="monotone" dataKey="major" name="Major" stackId="1" strokeWidth={2}
        stroke={SEVERITY_COLOR.Major} fill="url(#grad-Major)"
      />
      <Area
        type="monotone" dataKey="critical" name="Critical" stackId="1" strokeWidth={2}
        stroke={SEVERITY_COLOR.Critical} fill="url(#grad-Critical)"
      />
    </AreaChart>
  );
}

/* ------------------------------------------------------- defect type bars */

export function DefectTypeChart({
  data,
  colorOf,
}: {
  data: { type: string; count: number }[];
  colorOf: (t: string) => string;
}) {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} horizontal={false} />
      <XAxis type="number" {...axisProps} />
      <YAxis
        type="category" dataKey="type" width={140}
        {...axisProps} tick={{ fill: INK.secondary, fontSize: 11 }}
      />
      <Tooltip content={<TipBox />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
      <Bar dataKey="count" name="Detections" radius={[0, 4, 4, 0]} barSize={16}>
        {data.map((d) => (
          <Cell key={d.type} fill={colorOf(d.type)} />
        ))}
      </Bar>
    </BarChart>
  );
}

/* -------------------------------------------------------- severity donut */

export function SeverityDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <PieChart>
      <Tooltip content={<TipBox />} />
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius="58%"
        outerRadius="86%"
        paddingAngle={2}
        stroke={INK.surface}
        strokeWidth={2}
        label={({ name, value }) =>
          `${name} ${total ? Math.round(((value as number) / total) * 100) : 0}%`
        }
        labelLine={{ stroke: "rgba(255,255,255,0.18)" }}
      >
        {data.map((d) => (
          <Cell key={d.name} fill={SEVERITY_COLOR[d.name as keyof typeof SEVERITY_COLOR]} />
        ))}
      </Pie>
    </PieChart>
  );
}

/* ------------------------------------------------------ machine bar chart */

export function MachineDefectChart({
  data,
}: {
  data: { machine: string; count: number; waste: number }[];
}) {
  return (
    <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
      <XAxis dataKey="machine" {...axisProps} />
      <YAxis {...axisProps} width={44} />
      <Tooltip content={<TipBox />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
      <Bar dataKey="count" name="Detections" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} barSize={26} />
    </BarChart>
  );
}

/* ------------------------------------------------------- savings vs manual */

export function SavingsChart({
  data,
}: {
  data: { label: string; cumulative: number }[];
}) {
  return (
    <AreaChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
      <defs>
        <linearGradient id="grad-save" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.45} />
          <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
      <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
      <YAxis {...axisProps} width={56} tickFormatter={(v) => `$${v}`} />
      <Tooltip content={<TipBox />} cursor={{ stroke: "rgba(255,255,255,0.18)" }} />
      <Area
        type="monotone" dataKey="cumulative" name="Cumulative avoided cost (USD)"
        stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#grad-save)"
      />
    </AreaChart>
  );
}

/* ---------------------------------------------------------- hourly profile */

export function HourlyChart({ data }: { data: { hour: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <BarChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
      <XAxis dataKey="hour" {...axisProps} interval={1} />
      <YAxis {...axisProps} width={44} />
      <Tooltip content={<TipBox labelPrefix="Hour " />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
      <Bar dataKey="count" name="Detections" radius={[3, 3, 0, 0]}>
        {data.map((d) => (
          <Cell
            key={d.hour}
            fill={d.count > max * 0.72 ? SEVERITY_COLOR.Major : CHART_COLORS[0]}
          />
        ))}
      </Bar>
    </BarChart>
  );
}

/* ------------------------------------------------------------ shift chart */

export function ShiftChart({
  data,
}: {
  data: { shift: string; count: number; critical: number }[];
}) {
  return (
    <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={INK.grid} vertical={false} />
      <XAxis dataKey="shift" {...axisProps} />
      <YAxis {...axisProps} width={44} />
      <Tooltip content={<TipBox />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
      <Legend {...legendProps} />
      <Bar dataKey="count" name="All detections" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} barSize={22} />
      <Bar dataKey="critical" name="Critical only" fill={SEVERITY_COLOR.Critical} radius={[4, 4, 0, 0]} barSize={22} />
    </BarChart>
  );
}

/* ------------------------------------------------------------ radar chart */

export function MachineRadar({
  data,
  machines,
}: {
  data: Record<string, string | number>[];
  machines: { id: string; name: string }[];
}) {
  return (
    <RadarChart data={data} outerRadius="72%">
      <PolarGrid stroke="rgba(255,255,255,0.10)" />
      <PolarAngleAxis dataKey="dimension" tick={{ fill: INK.muted, fontSize: 11 }} />
      <Tooltip content={<TipBox />} />
      <Legend {...legendProps} />
      {machines.map((m, i) => (
        <Radar
          key={m.id}
          name={m.name}
          dataKey={m.id}
          stroke={CHART_COLORS[i % CHART_COLORS.length]}
          fill={CHART_COLORS[i % CHART_COLORS.length]}
          fillOpacity={0.14}
          strokeWidth={2}
        />
      ))}
    </RadarChart>
  );
}

/* -------------------------------------------------------------- sparkline */

export function Sparkline({
  data,
  color = CHART_COLORS[0],
}: {
  data: { v: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
