"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Activity, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import { defectsByMachine, inRangeDays } from "@/lib/analytics";
import {
  Badge, Button, Card, Field, Input, Modal, PageHeading, Select, statusTone,
} from "@/components/ui";
import { formatDate, money, num } from "@/lib/utils";
import type { Machine, MachineStatus } from "@/lib/types";

const TYPES: Machine["type"][] = [
  "Circular Knitting", "Stenter", "Weaving Loom", "Inspection Table", "Dyeing Range",
];
const STATUSES: MachineStatus[] = ["Running", "Idle", "Maintenance", "Stopped"];

const blank = (lineId: string): Machine => ({
  id: "",
  name: "",
  lineId,
  type: "Circular Knitting",
  model: "",
  status: "Idle",
  speedMpm: 40,
  fabricType: "",
  installedOn: new Date().toISOString().slice(0, 10),
  lastServiceOn: new Date().toISOString().slice(0, 10),
  operator: "",
  healthScore: 90,
  totalMetersToday: 0,
  defectRate: 0,
});

export default function MachinesPage() {
  const { machines, lines, defects, addMachine, updateMachine, removeMachine, currentUser } =
    useStore();
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "manager";

  const [editing, setEditing] = useState<Machine | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Machine | null>(null);

  const week = useMemo(() => inRangeDays(defects, 7), [defects]);
  const perMachine = useMemo(() => defectsByMachine(week, machines), [week, machines]);
  const statOf = (id: string) => perMachine.find((p) => p.id === id);

  return (
    <div>
      <PageHeading
        eyebrow="Factory"
        title="Machines & inspection points"
        description="Each machine is one inspection point: a camera, a light, an encoder and an edge node bolted onto equipment the factory already owns. Health score blends defect rate, service age and node uptime."
        action={
          canEdit ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Add machine
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.map((m, i) => {
          const s = statOf(m.id);
          const line = lines.find((l) => l.id === m.lineId);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {m.id} · {line?.name ?? m.lineId}
                    </p>
                    <h3 className="mt-1 truncate font-display text-[17px] font-semibold text-white">
                      {m.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[12px] text-slate-400">{m.model}</p>
                  </div>
                  <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                </div>

                {/* health */}
                <div className="mt-5">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                      Health score
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">
                      {m.healthScore}/100
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          m.healthScore > 80 ? "#00ab95" : m.healthScore > 60 ? "#c38302" : "#d04d5b",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.healthScore}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {[
                    ["Speed", m.status === "Running" ? `${m.speedMpm} m/min` : "—"],
                    ["Today", `${num(m.totalMetersToday)} m`],
                    ["Defects / 7d", s ? num(s.count) : "0"],
                    ["Cost / 7d", s ? money(s.cost) : "$0"],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                      <p className="mt-0.5 font-mono text-[13px] text-white">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 text-[12px] text-slate-400">
                  <p className="flex justify-between gap-3">
                    <span>Fabric</span>
                    <span className="truncate text-slate-300">{m.fabricType}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Operator</span>
                    <span className="truncate text-slate-300">{m.operator}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Last service</span>
                    <span className="text-slate-300">{formatDate(m.lastServiceOn)}</span>
                  </p>
                </div>

                <div className="mt-auto flex gap-2 pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditing(m)}
                  >
                    <Pencil size={13} /> {canEdit ? "Edit" : "View"}
                  </Button>
                  {canEdit ? (
                    <>
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() =>
                          updateMachine(m.id, {
                            status: m.status === "Running" ? "Maintenance" : "Running",
                            speedMpm: m.status === "Running" ? 0 : 42,
                          })
                        }
                        title="Toggle maintenance"
                      >
                        {m.status === "Running" ? <Wrench size={13} /> : <Activity size={13} />}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setConfirmDelete(m)}>
                        <Trash2 size={13} />
                      </Button>
                    </>
                  ) : null}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <MachineForm
        open={!!editing}
        machine={editing}
        lines={lines}
        readOnly={!canEdit}
        onClose={() => setEditing(null)}
        onSave={(m) => {
          updateMachine(m.id, m);
          setEditing(null);
        }}
      />

      <MachineForm
        open={creating}
        machine={creating ? blank(lines[0]?.id ?? "L-01") : null}
        lines={lines}
        isNew
        onClose={() => setCreating(false)}
        onSave={(m) => {
          addMachine({ ...m, id: m.id || `M-${Math.floor(Math.random() * 800 + 100)}` });
          setCreating(false);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove this machine?"
        subtitle={confirmDelete?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) removeMachine(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={15} /> Remove machine
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          Its historical defect records stay in the register, but the machine will disappear from
          live inspection, analytics grouping and device assignment.
        </p>
      </Modal>
    </div>
  );
}

function MachineForm({
  open, machine, lines, isNew, readOnly, onClose, onSave,
}: {
  open: boolean;
  machine: Machine | null;
  lines: { id: string; name: string }[];
  isNew?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (m: Machine) => void;
}) {
  const [draft, setDraft] = useState<Machine | null>(machine);
  const [key, setKey] = useState("");
  const identity = `${machine?.id}-${open}`;
  if (identity !== key) {
    setKey(identity);
    setDraft(machine);
  }
  if (!draft) return null;

  const set = <K extends keyof Machine>(k: K, v: Machine[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isNew ? "Add an inspection point" : draft.name}
      subtitle={isNew ? "Register a machine and its detection parameters." : draft.model}
      footer={
        readOnly ? (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(draft)}>{isNew ? "Add machine" : "Save changes"}</Button>
          </>
        )
      }
    >
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field label="Machine name" className="sm:col-span-2">
          <Input
            value={draft.name}
            placeholder="Circular Knit CK-103"
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Machine type">
          <Select value={draft.type} onChange={(e) => set("type", e.target.value as Machine["type"])}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Model">
          <Input
            value={draft.model}
            placeholder="Mayer & Cie Relanit 3.2"
            onChange={(e) => set("model", e.target.value)}
          />
        </Field>
        <Field label="Production line">
          <Select value={draft.lineId} onChange={(e) => set("lineId", e.target.value)}>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={(e) => set("status", e.target.value as MachineStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Speed (m/min)">
          <Input
            type="number" value={draft.speedMpm}
            onChange={(e) => set("speedMpm", +e.target.value)}
          />
        </Field>
        <Field label="Fabric type">
          <Input
            value={draft.fabricType}
            placeholder="Single Jersey 180 GSM"
            onChange={(e) => set("fabricType", e.target.value)}
          />
        </Field>
        <Field label="Operator">
          <Input value={draft.operator} onChange={(e) => set("operator", e.target.value)} />
        </Field>
        <Field label="Health score" hint="0 – 100">
          <Input
            type="number" min="0" max="100" value={draft.healthScore}
            onChange={(e) => set("healthScore", +e.target.value)}
          />
        </Field>
        <Field label="Installed on">
          <Input
            type="date" value={draft.installedOn}
            onChange={(e) => set("installedOn", e.target.value)}
          />
        </Field>
        <Field label="Last service">
          <Input
            type="date" value={draft.lastServiceOn}
            onChange={(e) => set("lastServiceOn", e.target.value)}
          />
        </Field>
        <Field label="Metres produced today">
          <Input
            type="number" value={draft.totalMetersToday}
            onChange={(e) => set("totalMetersToday", +e.target.value)}
          />
        </Field>
        <Field label="Defect rate (per 100 m)">
          <Input
            type="number" step="0.1" value={draft.defectRate}
            onChange={(e) => set("defectRate", +e.target.value)}
          />
        </Field>
      </fieldset>
    </Modal>
  );
}
