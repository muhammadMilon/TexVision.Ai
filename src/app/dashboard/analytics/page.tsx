"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Brain, CheckCircle2, Sparkles, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  defectsByShift, defectsByType, hourlyProfile, inRangeDays, machineRadar, rootCauseFindings,
} from "@/lib/analytics";
import {
  ChartFrame, DefectTypeChart, HourlyChart, MachineRadar, ShiftChart,
} from "@/components/charts";
import { Badge, Button, Card, CardHeader, PageHeading, Select } from "@/components/ui";
import { DEFECT_COLOR, OTHER_COLOR, money, num } from "@/lib/utils";

export default function AnalyticsPage() {
  const { defects, machines, updateMachine } = useStore();
  const [days, setDays] = useState(7);
  const [scanning, setScanning] = useState(false);
  const [actioned, setActioned] = useState<string[]>([]);

  const scoped = useMemo(() => inRangeDays(defects, days), [defects, days]);
  const findings = useMemo(() => rootCauseFindings(scoped, machines), [scoped, machines]);
  const byType = useMemo(() => defectsByType(scoped), [scoped]);
  const shifts = useMemo(() => defectsByShift(scoped), [scoped]);
  const hours = useMemo(() => hourlyProfile(scoped), [scoped]);
  const radarData = useMemo(() => machineRadar(scoped, machines), [scoped, machines]);
  const radarMachines = machines.slice(0, 4).map((m) => ({ id: m.id, name: m.id }));

  const totalSaving = findings.reduce((s, f) => s + f.estimatedSavingUsd, 0);

  function rerun() {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1400);
  }

  return (
    <div>
      <PageHeading
        eyebrow="Intelligence"
        title="Root-cause analysis"
        description="The step that turns detection into maintenance. Defects are clustered by machine, class and probable cause; anything recurring above chance is surfaced with a concrete fix and the money it would recover."
        action={
          <div className="flex gap-2">
            <Select
              value={days}
              onChange={(e) => setDays(+e.target.value)}
              className="w-auto"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
            </Select>
            <Button onClick={rerun} disabled={scanning}>
              <Sparkles size={15} className={scanning ? "animate-spin" : ""} />
              {scanning ? "Analysing…" : "Re-run analysis"}
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------- headline */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Findings", num(findings.length)],
          ["High priority", num(findings.filter((f) => f.severity === "High").length)],
          ["Events analysed", num(scoped.length)],
          ["Recoverable value", money(totalSaving)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-[#0e2033]/70 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
            <p className="mt-1.5 font-display text-xl font-bold text-white">{v}</p>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------- findings */}
      <Card className="mb-4">
        <CardHeader
          title="What the system thinks is going wrong"
          subtitle={`Clustered from ${num(scoped.length)} detections over ${days} day(s)`}
          action={
            <Badge tone="teal">
              <Brain size={11} /> Pattern engine
            </Badge>
          }
        />
        <div className="space-y-3 p-5 pt-4">
          {scanning ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-white/8 bg-white/4"
                />
              ))}
            </div>
          ) : (
            findings.map((f, i) => {
              const id = `${f.machineId}-${f.cause}`;
              const done = actioned.includes(id);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-5 transition ${
                    done
                      ? "border-teal/30 bg-teal/6"
                      : f.severity === "High"
                        ? "border-[#e05c68]/25 bg-[#e05c68]/5"
                        : "border-white/8 bg-white/3"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[16px] font-semibold text-white">
                          {f.cause}
                        </h3>
                        <Badge
                          tone={
                            f.severity === "High"
                              ? "danger"
                              : f.severity === "Medium"
                                ? "amber"
                                : "teal"
                          }
                        >
                          {f.severity} priority
                        </Badge>
                        {done ? (
                          <Badge tone="teal">
                            <CheckCircle2 size={11} /> Work order raised
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        {f.machineName} · {f.defectType} · {f.occurrences} events ·{" "}
                        {Math.round(f.share * 100)}% of this machine&apos;s defects ·{" "}
                        {Math.round(f.confidence * 100)}% confidence
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-teal">
                        {money(f.estimatedSavingUsd)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        recoverable
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-white/8 bg-[#0a1a2a]/60 p-4">
                    <Wrench size={16} className="shrink-0 text-teal" />
                    <p className="min-w-52 flex-1 text-[13px] leading-relaxed text-slate-300">
                      {f.recommendation}
                    </p>
                    <Button
                      size="sm"
                      variant={done ? "subtle" : "primary"}
                      disabled={done}
                      onClick={() => {
                        setActioned((a) => [...a, id]);
                        updateMachine(f.machineId, { status: "Maintenance", speedMpm: 0 });
                      }}
                    >
                      {done ? "Scheduled" : "Raise work order"}
                    </Button>
                  </div>

                  {/* evidence bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                      <span>Share of this machine&apos;s defects</span>
                      <span>{Math.round(f.share * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            f.severity === "High"
                              ? "#d04d5b"
                              : f.severity === "Medium"
                                ? "#c38302"
                                : "#00ab95",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, f.share * 100)}%` }}
                        transition={{ duration: 0.7 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {!scanning && !findings.length ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No cause recurs often enough in this window to be called a pattern.
            </p>
          ) : null}
        </div>
      </Card>

      {/* ---------------------------------------------------------- charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="Defect classes"
          caption="Class names sit on the axis, so the chart still reads without colour."
          height={280}
        >
          <DefectTypeChart data={byType} colorOf={(t) => DEFECT_COLOR[t] ?? OTHER_COLOR} />
        </ChartFrame>

        <ChartFrame
          title="Defect signature by machine"
          caption="Each machine's characteristic mix of defect classes. A spike on one axis is a mechanical fault, not bad luck."
          height={280}
        >
          <MachineRadar data={radarData} machines={radarMachines} />
        </ChartFrame>

        <ChartFrame
          title="Detections by shift"
          caption="Shift C runs 22:00–06:00 — the window where visual inspection fatigue is worst."
          height={260}
        >
          <ShiftChart data={shifts} />
        </ChartFrame>

        <ChartFrame
          title="Detections by hour of day"
          caption="Amber bars mark the busiest hours. Clustering at shift boundaries usually points to machine restart conditions."
          height={260}
        >
          <HourlyChart data={hours} />
        </ChartFrame>
      </div>

      {/* --------------------------------------------------- shift table */}
      <Card className="mt-4">
        <CardHeader title="Shift comparison" subtitle="Same window, broken out by crew" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Shift", "Window", "Detections", "Critical", "Fabric loss", "Cost"].map((h) => (
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
              {shifts.map((s) => (
                <tr key={s.shift} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium text-white">{s.shift}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-slate-400">{s.window}</td>
                  <td className="px-5 py-3 text-slate-300">{num(s.count)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={s.critical > 20 ? "danger" : "slate"}>{s.critical}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300">{s.waste} m</td>
                  <td className="px-5 py-3 font-mono text-white">{money(s.waste * 3.1, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
