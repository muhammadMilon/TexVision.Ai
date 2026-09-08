"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Cpu, Gauge, ShieldAlert, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  NOW,
  defectsByDay,
  defectsByMachine,
  defectsByType,
  inRangeDays,
  kpis,
  rootCauseFindings,
  savingsProjection,
  severitySplit,
} from "@/lib/analytics";
import {
  ChartFrame,
  DefectTrendChart,
  DefectTypeChart,
  MachineDefectChart,
  SavingsChart,
  SeverityDonut,
} from "@/components/charts";
import { StatTile } from "@/components/dashboard/StatTile";
import { Badge, Card, CardHeader, PageHeading, severityTone, statusTone } from "@/components/ui";
import { DEFECT_COLOR, OTHER_COLOR, money, num, timeAgo } from "@/lib/utils";

export default function OverviewPage() {
  const { defects, machines, devices, alerts, currentUser } = useStore();

  const k = useMemo(() => kpis(defects, machines, devices), [defects, machines, devices]);
  const trend = useMemo(() => defectsByDay(defects, 14), [defects]);
  const last7 = useMemo(() => inRangeDays(defects, 7), [defects]);
  const byType = useMemo(() => defectsByType(last7), [last7]);
  const byMachine = useMemo(() => defectsByMachine(last7, machines), [last7, machines]);
  const severity = useMemo(() => severitySplit(last7), [last7]);
  const savings = useMemo(() => savingsProjection(defects), [defects]);
  const findings = useMemo(() => rootCauseFindings(last7, machines).slice(0, 3), [last7, machines]);
  const recent = useMemo(() => defects.slice(0, 6), [defects]);

  const sparkFrom = (key: "total" | "waste") => trend.slice(-10).map((t) => ({ v: t[key] }));

  return (
    <div>
      <PageHeading
        eyebrow={`Shift in progress · ${NOW.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`}
        title={`Good evening, ${currentUser?.name.split(" ")[0]}`}
        description="Everything below is computed from the live inspection stream: what the edge nodes detected, what it is costing, and what the system thinks is causing it."
        action={
          <Link
            href="/dashboard/live"
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-bold text-[#04231f] transition hover:bg-[#2adcc2]"
          >
            Open live inspection <ArrowUpRight size={15} />
          </Link>
        }
      />

      {/* ------------------------------------------------------------ KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          index={0}
          label="Defects — last 24 h"
          value={num(k.defects24)}
          delta={k.defectsDelta}
          hint={`${k.critical} critical`}
          spark={sparkFrom("total")}
        />
        <StatTile
          index={1}
          label="Fabric loss — last 24 h"
          value={k.wasteMeters.toFixed(1)}
          unit="m"
          hint={`${money(k.costUsd, 2)} at $3.10/m`}
          accent="#c38302"
          spark={sparkFrom("waste")}
        />
        <StatTile
          index={2}
          label="Estimated cost avoided"
          value={money(k.savedUsd, 0)}
          hint="vs. manual inspection catch rate"
          accent="#00ab95"
        />
        <StatTile
          index={3}
          label="Edge nodes online"
          value={`${k.devicesOnline}/${k.devicesTotal}`}
          hint={`${k.avgLatency.toFixed(0)} ms mean inference`}
          accent="#4385c0"
        />
      </div>

      {/* ---------------------------------------------------------- charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartFrame
          className="lg:col-span-2"
          title="Detections over the last 14 days"
          caption="Stacked by severity. The band widths show how much of the load is genuinely critical rather than cosmetic."
          height={280}
        >
          <DefectTrendChart data={trend} />
        </ChartFrame>

        <ChartFrame
          title="Severity mix — 7 days"
          caption="Critical defects are the ones that scrap fabric outright."
          height={280}
        >
          <SeverityDonut data={severity} />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Defect classes — 7 days"
          caption="Each class is a separate detector output. Class names are labelled on the axis, so colour is never the only cue."
          height={280}
        >
          <DefectTypeChart data={byType} colorOf={(t) => DEFECT_COLOR[t] ?? OTHER_COLOR} />
        </ChartFrame>

        <ChartFrame
          title="Detections by machine — 7 days"
          caption="The tall bar is where a maintenance visit pays for itself fastest."
          height={280}
        >
          <MachineDefectChart data={byMachine} />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartFrame
          className="lg:col-span-2"
          title="Cumulative cost avoided"
          caption="Value of the fabric the system caught that manual inspection would statistically have missed, accumulated over the period."
          height={250}
        >
          <SavingsChart data={savings} />
        </ChartFrame>

        {/* ------------------------------------------------ AI findings */}
        <Card className="flex flex-col">
          <CardHeader
            title="Root-cause engine"
            subtitle="Top clustered findings"
            action={
              <Link
                href="/dashboard/analytics"
                className="text-[11px] font-semibold text-teal transition hover:underline"
              >
                View all
              </Link>
            }
          />
          <div className="flex-1 space-y-3 p-5 pt-4">
            {findings.map((f) => (
              <motion.div
                key={`${f.machineId}-${f.cause}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-white/8 bg-white/3 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-white">{f.cause}</p>
                  <Badge tone={f.severity === "High" ? "danger" : f.severity === "Medium" ? "amber" : "teal"}>
                    {f.severity}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {f.machineId} · {f.defectType} · {f.occurrences} events ·{" "}
                  {Math.round(f.confidence * 100)}% conf.
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{f.recommendation}</p>
              </motion.div>
            ))}
            {!findings.length ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Not enough clustered evidence yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      {/* ------------------------------------------- recent + machines */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Latest detections"
            subtitle="Straight off the inference stream"
            action={
              <Link
                href="/dashboard/defects"
                className="text-[11px] font-semibold text-teal transition hover:underline"
              >
                All records
              </Link>
            }
          />
          <div className="mt-4 divide-y divide-white/5">
            {recent.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <TriangleAlert
                  size={15}
                  className={
                    d.severity === "Critical"
                      ? "text-[#e05c68]"
                      : d.severity === "Major"
                        ? "text-amber"
                        : "text-teal"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">
                    {d.type} <span className="text-slate-500">on</span> {d.machineId}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {d.code} · {d.positionMeters} m · {(d.confidence * 100).toFixed(0)}% ·{" "}
                    {timeAgo(d.detectedAt, NOW)}
                  </p>
                </div>
                <Badge tone={severityTone(d.severity)}>{d.severity}</Badge>
                <span className="hidden w-20 text-right font-mono text-xs text-slate-400 sm:block">
                  {money(d.costImpactUsd, 2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Machine health" subtitle="Live status by inspection point" />
            <div className="space-y-3 p-5 pt-4">
              {machines.map((m) => (
                <div key={m.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-slate-300">{m.name}</span>
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            m.healthScore > 80 ? "#00ab95" : m.healthScore > 60 ? "#c38302" : "#d04d5b",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.healthScore}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[11px] text-slate-400">
                      {m.healthScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Open alerts" subtitle="Unacknowledged" />
            <div className="space-y-2 p-5 pt-4">
              {alerts.filter((a) => !a.acknowledged).slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="flex gap-2.5 rounded-xl border border-white/8 bg-white/3 p-3"
                >
                  <ShieldAlert
                    size={14}
                    className={`mt-0.5 shrink-0 ${a.level === "Critical" ? "text-[#e05c68]" : "text-amber"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-white">{a.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {timeAgo(a.at, NOW)} · {a.machineId}
                    </p>
                  </div>
                </div>
              ))}
              {!alerts.filter((a) => !a.acknowledged).length ? (
                <p className="py-4 text-center text-xs text-slate-500">Everything acknowledged.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {/* --------------------------------------------------- footer strip */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Cpu, label: "Model", value: "yolov10n-fabric-v3.1", sub: "INT8, 38 ms/frame" },
          { icon: Gauge, label: "Throughput today", value: `${num(k.metersToday)} m`, sub: "across all inspection points" },
          { icon: ShieldAlert, label: "Detection rate", value: `${k.defectRate.toFixed(2)} / 100 m`, sub: "internal threshold 3.0" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0e2033]/60 p-5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
              <s.icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className="truncate font-display text-[15px] font-semibold text-white">{s.value}</p>
              <p className="truncate text-[11px] text-slate-500">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
