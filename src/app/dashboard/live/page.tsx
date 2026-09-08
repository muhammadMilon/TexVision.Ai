"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, Save, Siren, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { FabricScanner } from "@/components/FabricScanner";
import { Badge, Button, Card, CardHeader, PageHeading, severityTone } from "@/components/ui";
import { inferRootCause, type LiveDetection } from "@/lib/ai";
import { NOW } from "@/lib/analytics";
import { money } from "@/lib/utils";
import type { Defect } from "@/lib/types";

export default function LivePage() {
  const { machines, devices, addDefect, pushAlert, alerts } = useStore();
  const [machineId, setMachineId] = useState("M-101");
  const [running, setRunning] = useState(true);
  const [sensitivity, setSensitivity] = useState(55);
  const [autoLog, setAutoLog] = useState(true);
  const [autoStop, setAutoStop] = useState(true);
  const [feed, setFeed] = useState<LiveDetection[]>([]);
  const [saved, setSaved] = useState(0);
  const counter = useRef(0);

  const machine = machines.find((m) => m.id === machineId) ?? machines[0];
  const node = devices.find((d) => d.machineId === machineId && d.kind === "Edge AI Compute");

  const criticalInFeed = feed.filter((f) => f.severity === "Critical").length;
  const andon: "red" | "amber" | "green" =
    criticalInFeed > 0 ? "red" : feed.some((f) => f.severity === "Major") ? "amber" : "green";

  const toDefect = useCallback(
    (d: LiveDetection, mId: string): Defect => {
      counter.current += 1;
      const widthCm = +(d.w * 140).toFixed(1);
      const lengthCm = +(d.h * 120).toFixed(1);
      const lossFactor = d.severity === "Critical" ? 1.6 : d.severity === "Major" ? 0.7 : 0.22;
      const fabricLossMeters = +(((widthCm * lengthCm) / 900) * lossFactor + 0.15).toFixed(2);
      const m = machines.find((x) => x.id === mId);
      return {
        id: `DF-L${Date.now()}${counter.current}`,
        code: `${mId}-LIVE${counter.current.toString().padStart(3, "0")}`,
        detectedAt: new Date().toISOString(),
        machineId: mId,
        lineId: m?.lineId ?? "L-01",
        type: d.type,
        severity: d.severity,
        status: "Open",
        confidence: d.confidence,
        positionMeters: +(Math.random() * 1800).toFixed(1),
        widthCm,
        lengthCm,
        fabricLossMeters,
        costImpactUsd: +(fabricLossMeters * 3.1).toFixed(2),
        operator: m?.operator ?? "Unassigned",
        shift: "B",
        rootCause: inferRootCause(d.type),
        notes: "Auto-logged from the live inspection stream.",
        imageSeed: Math.floor(Math.random() * 100000),
      };
    },
    [machines],
  );

  const handleDetect = useCallback(
    (d: LiveDetection) => {
      setFeed((prev) => [d, ...prev].slice(0, 40));

      if (autoLog) {
        addDefect(toDefect(d, machineId));
        setSaved((s) => s + 1);
      }

      if (d.severity === "Critical" && autoStop) {
        pushAlert({
          id: `AL-L${Date.now()}`,
          at: new Date().toISOString(),
          level: "Critical",
          title: `Critical ${d.type} on ${machineId}`,
          message: `Detected at ${(d.confidence * 100).toFixed(
            0,
          )}% confidence. Auto-stop signal sent to the Andon tower.`,
          machineId,
          acknowledged: false,
        });
      }
    },
    [autoLog, autoStop, addDefect, toDefect, machineId, pushAlert],
  );

  const stats = useMemo(() => {
    const waste = feed.reduce((s, f) => {
      const factor = f.severity === "Critical" ? 1.6 : f.severity === "Major" ? 0.7 : 0.22;
      return s + (((f.w * 140) * (f.h * 120)) / 900) * factor + 0.15;
    }, 0);
    return {
      count: feed.length,
      critical: criticalInFeed,
      waste,
      cost: waste * 3.1,
      meanConf: feed.length ? feed.reduce((s, f) => s + f.confidence, 0) / feed.length : 0,
    };
  }, [feed, criticalInFeed]);

  return (
    <div>
      <PageHeading
        eyebrow="Monitor"
        title="Live inspection"
        description="The inference stream from the edge node on the selected machine. Every box is a detection the model produced on-device; nothing here round-trips to a server."
        action={
          <div className="flex gap-2">
            <Button variant={running ? "outline" : "primary"} onClick={() => setRunning((r) => !r)}>
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? "Pause feed" : "Resume feed"}
            </Button>
            <Button variant="subtle" onClick={() => { setFeed([]); setSaved(0); }}>
              <Trash2 size={15} /> Clear
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* --------------------------------------------------- viewport */}
        <div className="space-y-4">
          <FabricScanner
            running={running}
            sensitivity={sensitivity}
            speedMpm={machine?.speedMpm || 42}
            cameraLabel={`CAM ${machineId.slice(-2)}`}
            onDetect={handleDetect}
          />

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Detections", stats.count.toString()],
              ["Critical", stats.critical.toString()],
              ["Fabric loss", `${stats.waste.toFixed(2)} m`],
              ["Cost impact", money(stats.cost, 2)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-[#0e2033]/70 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                <p className="mt-1.5 font-display text-xl font-bold text-white">{v}</p>
              </div>
            ))}
          </div>

          {/* ------------------------------------------------ controls */}
          <Card>
            <CardHeader title="Inspection controls" subtitle="Applied to the edge node in real time" />
            <div className="grid gap-5 p-5 pt-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Inspection point
                </span>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a1a2a] px-3 py-2.5 text-sm text-white outline-none focus:border-teal/60"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.fabricType}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Detector sensitivity
                  </span>
                  <span className="font-mono text-sm text-teal">{sensitivity}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={sensitivity}
                  onChange={(e) => setSensitivity(+e.target.value)}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Higher sensitivity catches more minor defects at the cost of false positives.
                </p>
              </div>

              <Toggle
                label="Auto-log detections"
                hint="Write every detection into the defect register"
                value={autoLog}
                onChange={setAutoLog}
              />
              <Toggle
                label="Auto-stop on Critical"
                hint="Fire the Andon tower and raise a plant alert"
                value={autoStop}
                onChange={setAutoStop}
              />
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------ side */}
        <div className="space-y-4">
          {/* andon */}
          <Card>
            <CardHeader title="Andon signal tower" subtitle={`Patlite LR6 · ${machineId}`} />
            <div className="flex items-center gap-6 p-5 pt-4">
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                {(["red", "amber", "green"] as const).map((c) => {
                  const on = andon === c;
                  const color = c === "red" ? "#e05c68" : c === "amber" ? "#c38302" : "#00ab95";
                  return (
                    <span
                      key={c}
                      className="h-7 w-10 rounded-md transition-all duration-300"
                      style={{
                        background: on ? color : `${color}22`,
                        boxShadow: on ? `0 0 22px ${color}` : "none",
                      }}
                    />
                  );
                })}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-white">
                  {andon === "red" ? "Stop the machine" : andon === "amber" ? "Operator attention" : "Running clean"}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                  {andon === "red"
                    ? "A critical defect was detected. The relay interlock has signalled auto-stop."
                    : andon === "amber"
                      ? "Major defects present. Check the fabric at the flagged positions."
                      : "No major or critical detections in the current window."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="slate">
                    <Siren size={11} /> {alerts.filter((a) => !a.acknowledged).length} open alerts
                  </Badge>
                  {autoLog ? (
                    <Badge tone="teal">
                      <Save size={11} /> {saved} logged
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          {/* edge node */}
          <Card>
            <CardHeader title="Edge node" subtitle={node?.hardware ?? "No node assigned"} />
            <div className="grid grid-cols-2 gap-3 p-5 pt-4">
              {[
                ["Status", node?.status ?? "—"],
                ["Firmware", node?.firmware ?? "—"],
                ["Inference", node ? `${node.latencyMs} ms` : "—"],
                ["Node temp", node ? `${node.tempC} °C` : "—"],
                ["CPU load", node ? `${node.cpuPct}%` : "—"],
                ["Mean confidence", `${(stats.meanConf * 100).toFixed(1)}%`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                  <p className="mt-0.5 font-mono text-[13px] text-white">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* stream */}
          <Card className="flex max-h-[520px] flex-col">
            <CardHeader
              title="Detection stream"
              subtitle={running ? "Receiving from the edge node" : "Feed paused"}
            />
            <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
              <AnimatePresence initial={false}>
                {feed.map((f) => (
                  <motion.div
                    key={f.id}
                    layout
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">{f.type}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        {(f.confidence * 100).toFixed(0)}% ·{" "}
                        {new Date(f.at).toLocaleTimeString("en-GB")}
                      </p>
                    </div>
                    <Badge tone={severityTone(f.severity)}>{f.severity}</Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!feed.length ? (
                <p className="py-10 text-center text-xs text-slate-500">
                  {running
                    ? "Waiting for the first detection…"
                    : "Feed is paused. Resume to receive detections."}
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-slate-600">
        Demonstration build · detections are simulated locally · anchor date{" "}
        {NOW.toLocaleDateString("en-GB")}
      </p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-3 text-left transition hover:border-teal/30"
    >
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
          value ? "bg-teal" : "bg-white/12"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : ""}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{hint}</span>
      </span>
    </button>
  );
}
