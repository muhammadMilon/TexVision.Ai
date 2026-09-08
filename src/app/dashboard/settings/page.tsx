"use client";

import { useState } from "react";
import { AlertTriangle, Cpu, Database, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeading, Select,
} from "@/components/ui";
import { num } from "@/lib/utils";

export default function SettingsPage() {
  const { defects, machines, devices, reports, users, resetAll, currentUser } = useStore();
  const isAdmin = currentUser?.role === "admin";

  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  const [thresholds, setThresholds] = useState({
    criticalPerHour: 3,
    defectRate: 3.0,
    minConfidence: 0.7,
    autoStop: "critical",
    aqlDefault: "2.5",
    fabricCost: 3.1,
    syncMinutes: 15,
  });

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div>
      <PageHeading
        eyebrow="Admin"
        title="Settings"
        description="Detection thresholds, alerting behaviour and the local data store. Threshold changes would be pushed to every edge node on the next sync."
        action={
          <Button onClick={save}>
            <Save size={15} /> {saved ? "Saved" : "Save settings"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* -------------------------------------------------- detection */}
        <Card>
          <CardHeader
            title="Detection thresholds"
            subtitle="Applied on-device by every edge node"
            action={<Badge tone="teal"><SlidersHorizontal size={11} /> Edge config</Badge>}
          />
          <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
            <Field label="Minimum confidence" hint="Detections below this are discarded">
              <Input
                type="number" step="0.05" min="0" max="1" value={thresholds.minConfidence}
                onChange={(e) => setThresholds({ ...thresholds, minConfidence: +e.target.value })}
              />
            </Field>
            <Field label="Defect rate alarm" hint="Detections per 100 m">
              <Input
                type="number" step="0.1" value={thresholds.defectRate}
                onChange={(e) => setThresholds({ ...thresholds, defectRate: +e.target.value })}
              />
            </Field>
            <Field label="Critical cluster limit" hint="Criticals per hour before escalation">
              <Input
                type="number" value={thresholds.criticalPerHour}
                onChange={(e) => setThresholds({ ...thresholds, criticalPerHour: +e.target.value })}
              />
            </Field>
            <Field label="Auto-stop policy">
              <Select
                value={thresholds.autoStop}
                onChange={(e) => setThresholds({ ...thresholds, autoStop: e.target.value })}
              >
                <option value="off">Never stop the machine</option>
                <option value="critical">Stop on Critical detections</option>
                <option value="cluster">Stop on a critical cluster only</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* ---------------------------------------------------- costing */}
        <Card>
          <CardHeader title="Costing & compliance" subtitle="Used by the waste model and reports" />
          <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
            <Field label="Fabric cost (USD / m)">
              <Input
                type="number" step="0.1" value={thresholds.fabricCost}
                onChange={(e) => setThresholds({ ...thresholds, fabricCost: +e.target.value })}
              />
            </Field>
            <Field label="Default AQL level">
              <Select
                value={thresholds.aqlDefault}
                onChange={(e) => setThresholds({ ...thresholds, aqlDefault: e.target.value })}
              >
                <option value="1.5">AQL 1.5 — strict</option>
                <option value="2.5">AQL 2.5 — standard</option>
                <option value="4.0">AQL 4.0 — relaxed</option>
              </Select>
            </Field>
            <Field label="Metadata sync interval" hint="Minutes between gateway uploads">
              <Input
                type="number" value={thresholds.syncMinutes}
                onChange={(e) => setThresholds({ ...thresholds, syncMinutes: +e.target.value })}
              />
            </Field>
            <Field label="Scoring standard">
              <Select defaultValue="4pt">
                <option value="4pt">Four-point (ASTM D5430)</option>
                <option value="10pt">Ten-point system</option>
                <option value="graniteville">Graniteville &ldquo;78&rdquo;</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* ------------------------------------------------------- model */}
        <Card>
          <CardHeader title="Deployed model" subtitle="Same build on every node" />
          <div className="grid grid-cols-2 gap-3 p-5 pt-4">
            {[
              ["Architecture", "YOLOv10-nano"],
              ["Build", "fabric-v3.1 (INT8)"],
              ["Classes", "7 defect types"],
              ["Detection accuracy", "96.4%"],
              ["Precision", "94.2%"],
              ["Recall", "91.7%"],
              ["Mean inference", "38 ms"],
              ["Training data", "MVTec AD + TILDA + in-house"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                <p className="mt-0.5 font-mono text-[12px] text-white">{v}</p>
              </div>
            ))}
          </div>
          <div className="mx-5 mb-5 flex gap-3 rounded-xl border border-teal/22 bg-teal/6 p-4">
            <Cpu size={16} className="mt-0.5 shrink-0 text-teal" />
            <p className="text-[12px] leading-relaxed text-slate-300">
              Model updates are staged to one node first, run in shadow mode for a shift, then
              rolled out to the fleet if recall does not regress.
            </p>
          </div>
        </Card>

        {/* -------------------------------------------------------- data */}
        <Card>
          <CardHeader
            title="Local data store"
            subtitle="This demo persists everything in your browser"
            action={<Badge tone="slate"><Database size={11} /> localStorage</Badge>}
          />
          <div className="grid grid-cols-2 gap-3 p-5 pt-4 sm:grid-cols-3">
            {[
              ["Defect records", num(defects.length)],
              ["Machines", num(machines.length)],
              ["IoT devices", num(devices.length)],
              ["QC reports", num(reports.length)],
              ["Users", num(users.length)],
              ["Backend", "none"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                <p className="mt-0.5 font-display text-[16px] font-bold text-white">{v}</p>
              </div>
            ))}
          </div>

          <div className="mx-5 mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-[#e05c68]/25 bg-[#e05c68]/6 p-4">
            <AlertTriangle size={18} className="shrink-0 text-[#e05c68]" />
            <p className="min-w-52 flex-1 text-[12px] leading-relaxed text-slate-300">
              Resetting restores the seeded dataset and discards everything you have created,
              edited or deleted in this browser.
            </p>
            <Button
              variant="danger"
              disabled={!isAdmin}
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={15} /> Reset demo data
            </Button>
          </div>
          {!isAdmin ? (
            <p className="mx-5 mb-5 -mt-2 text-[11px] text-slate-500">
              Only an admin account can reset the data store.
            </p>
          ) : null}
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all demo data?"
        subtitle="This cannot be undone"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
              }}
            >
              <RotateCcw size={15} /> Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          Every defect, machine, device, report and user account returns to its seeded state. Your
          session stays signed in.
        </p>
      </Modal>
    </div>
  );
}
