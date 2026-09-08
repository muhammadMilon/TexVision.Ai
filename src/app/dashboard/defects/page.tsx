"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge, Button, Card, Field, Input, Modal, PageHeading, Select, Textarea,
  severityTone, statusTone,
} from "@/components/ui";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { DEFECT_COLOR, OTHER_COLOR, downloadText, formatDateTime, money, num } from "@/lib/utils";
import { ROOT_CAUSES } from "@/lib/seed";
import { inferRootCause } from "@/lib/ai";
import type { Defect, DefectStatus, DefectType, Severity } from "@/lib/types";

const TYPES: DefectType[] = [
  "Hole", "Yarn Break", "Oil Stain", "Colour Shift", "Knitting Irregularity", "Slub", "Misalignment",
];
const SEVERITIES: Severity[] = ["Critical", "Major", "Minor"];
const STATUSES: DefectStatus[] = ["Open", "Under Review", "Resolved", "False Positive"];

const blank = (machineId: string, lineId: string): Defect => ({
  id: "",
  code: "",
  detectedAt: new Date().toISOString(),
  machineId,
  lineId,
  type: "Hole",
  severity: "Major",
  status: "Open",
  confidence: 0.9,
  positionMeters: 0,
  widthCm: 3,
  lengthCm: 5,
  fabricLossMeters: 0,
  costImpactUsd: 0,
  operator: "",
  shift: "A",
  rootCause: ROOT_CAUSES.Hole[0],
  notes: "",
  imageSeed: 1,
});

export default function DefectsPage() {
  const { defects, machines, addDefect, updateDefect, removeDefect, currentUser } = useStore();
  const readOnly = currentUser?.role === "viewer";

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [machineF, setMachineF] = useState("all");

  const [editing, setEditing] = useState<Defect | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Defect | null>(null);

  const filtered = useMemo(
    () =>
      defects.filter((d) => {
        if (type !== "all" && d.type !== type) return false;
        if (severity !== "all" && d.severity !== severity) return false;
        if (status !== "all" && d.status !== status) return false;
        if (machineF !== "all" && d.machineId !== machineF) return false;
        if (q) {
          const hay = `${d.code} ${d.type} ${d.operator} ${d.rootCause} ${d.machineId}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [defects, q, type, severity, status, machineF],
  );

  const totals = useMemo(
    () => ({
      count: filtered.length,
      waste: filtered.reduce((s, d) => s + d.fabricLossMeters, 0),
      cost: filtered.reduce((s, d) => s + d.costImpactUsd, 0),
      critical: filtered.filter((d) => d.severity === "Critical").length,
    }),
    [filtered],
  );

  const columns: Column<Defect>[] = [
    {
      key: "code",
      header: "Record",
      sortValue: (d) => d.code,
      cell: (d) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ background: DEFECT_COLOR[d.type] ?? OTHER_COLOR }}
          />
          <div>
            <p className="font-mono text-[12px] text-white">{d.code}</p>
            <p className="text-[11px] text-slate-500">{formatDateTime(d.detectedAt)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Class",
      sortValue: (d) => d.type,
      cell: (d) => <span className="text-[13px] text-slate-200">{d.type}</span>,
    },
    {
      key: "machine",
      header: "Machine",
      sortValue: (d) => d.machineId,
      cell: (d) => <span className="font-mono text-[12px] text-slate-300">{d.machineId}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (d) => ({ Critical: 0, Major: 1, Minor: 2 })[d.severity],
      cell: (d) => <Badge tone={severityTone(d.severity)}>{d.severity}</Badge>,
    },
    {
      key: "confidence",
      header: "Conf.",
      sortValue: (d) => d.confidence,
      align: "right",
      cell: (d) => (
        <span className="font-mono text-[12px] text-slate-300">
          {(d.confidence * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: "position",
      header: "Roll pos.",
      sortValue: (d) => d.positionMeters,
      align: "right",
      cell: (d) => (
        <span className="font-mono text-[12px] text-slate-400">{d.positionMeters} m</span>
      ),
    },
    {
      key: "loss",
      header: "Loss",
      sortValue: (d) => d.fabricLossMeters,
      align: "right",
      cell: (d) => (
        <div>
          <p className="font-mono text-[12px] text-white">{d.fabricLossMeters} m</p>
          <p className="font-mono text-[11px] text-slate-500">{money(d.costImpactUsd, 2)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (d) => d.status,
      cell: (d) => <Badge tone={statusTone(d.status)}>{d.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (d) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(d); }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-teal"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          {!readOnly ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(d); }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-[#e05c68]"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  function exportCsv() {
    const head = [
      "code", "detected_at", "machine", "line", "type", "severity", "status",
      "confidence", "position_m", "width_cm", "length_cm", "loss_m", "cost_usd",
      "operator", "shift", "root_cause",
    ].join(",");
    const body = filtered
      .map((d) =>
        [
          d.code, d.detectedAt, d.machineId, d.lineId, d.type, d.severity, d.status,
          d.confidence, d.positionMeters, d.widthCm, d.lengthCm, d.fabricLossMeters,
          d.costImpactUsd, `"${d.operator}"`, d.shift, `"${d.rootCause}"`,
        ].join(","),
      )
      .join("\n");
    downloadText(`texvision-defects-${Date.now()}.csv`, `${head}\n${body}`);
  }

  return (
    <div>
      <PageHeading
        eyebrow="Monitor"
        title="Defect records"
        description="Every detection the edge nodes have written, with the geometry, the roll position and the costed material loss. Records can be edited, reclassified as false positives, or added by hand from a manual inspection."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download size={15} /> Export CSV
            </Button>
            {!readOnly ? (
              <Button onClick={() => setCreating(true)}>
                <Plus size={15} /> Log a defect
              </Button>
            ) : null}
          </div>
        }
      />

      {/* -------------------------------------------------------- summary */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Records in view", num(totals.count)],
          ["Critical", num(totals.critical)],
          ["Fabric loss", `${totals.waste.toFixed(1)} m`],
          ["Cost impact", money(totals.cost, 2)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-[#0e2033]/70 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
            <p className="mt-1.5 font-display text-xl font-bold text-white">{v}</p>
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------- filters */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search records…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All classes</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">All severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={machineF} onChange={(e) => setMachineF(e.target.value)}>
            <option value="all">All machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <DataTable
          rows={filtered}
          columns={columns}
          pageSize={12}
          emptyMessage="No records match these filters."
          onRowClick={(d) => setEditing(d)}
        />
      </Card>

      {/* ----------------------------------------------------- edit modal */}
      <DefectForm
        open={!!editing}
        defect={editing}
        machines={machines}
        readOnly={readOnly}
        onClose={() => setEditing(null)}
        onSave={(d) => {
          updateDefect(d.id, d);
          setEditing(null);
        }}
      />

      {/* --------------------------------------------------- create modal */}
      <DefectForm
        open={creating}
        defect={creating ? blank(machines[0]?.id ?? "M-101", machines[0]?.lineId ?? "L-01") : null}
        machines={machines}
        isNew
        onClose={() => setCreating(false)}
        onSave={(d) => {
          addDefect({
            ...d,
            id: `DF-M${Date.now()}`,
            code: `${d.machineId}-MAN${Math.floor(Math.random() * 900 + 100)}`,
          });
          setCreating(false);
        }}
      />

      {/* --------------------------------------------------- delete modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this record?"
        subtitle={confirmDelete?.code}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) removeDefect(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={15} /> Delete record
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          Deleting a detection removes it from waste totals, analytics and any report generated
          afterwards. If the detection was wrong, marking it{" "}
          <b className="text-white">False Positive</b> instead keeps the audit trail intact.
        </p>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------- form */

function DefectForm({
  open, defect, machines, isNew, readOnly, onClose, onSave,
}: {
  open: boolean;
  defect: Defect | null;
  machines: { id: string; name: string; lineId: string; operator: string }[];
  isNew?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (d: Defect) => void;
}) {
  const [draft, setDraft] = useState<Defect | null>(defect);
  const [key, setKey] = useState("");

  // Re-seed the draft whenever a different record is opened.
  const identity = `${defect?.id}-${open}`;
  if (identity !== key) {
    setKey(identity);
    setDraft(defect);
  }
  if (!draft) return null;

  const set = <K extends keyof Defect>(k: K, v: Defect[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  function recost(next: Defect) {
    const factor = next.severity === "Critical" ? 1.6 : next.severity === "Major" ? 0.7 : 0.22;
    const loss = +(((next.widthCm * next.lengthCm) / 900) * factor + 0.15).toFixed(2);
    return { ...next, fabricLossMeters: loss, costImpactUsd: +(loss * 3.1).toFixed(2) };
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isNew ? "Log a defect manually" : `Record ${draft.code}`}
      subtitle={
        isNew
          ? "Use this when a QC inspector finds something the camera did not cover."
          : "Edit the classification, status or root cause."
      }
      footer={
        readOnly ? (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(recost(draft))}>
              {isNew ? "Create record" : "Save changes"}
            </Button>
          </>
        )
      }
    >
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field label="Defect class">
          <Select
            value={draft.type}
            onChange={(e) => {
              const t = e.target.value as DefectType;
              setDraft((d) => (d ? { ...d, type: t, rootCause: ROOT_CAUSES[t][0] } : d));
            }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>

        <Field label="Severity">
          <Select value={draft.severity} onChange={(e) => set("severity", e.target.value as Severity)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>

        <Field label="Machine">
          <Select
            value={draft.machineId}
            onChange={(e) => {
              const m = machines.find((x) => x.id === e.target.value);
              setDraft((d) =>
                d ? { ...d, machineId: e.target.value, lineId: m?.lineId ?? d.lineId, operator: m?.operator ?? d.operator } : d,
              );
            }}
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Status">
          <Select value={draft.status} onChange={(e) => set("status", e.target.value as DefectStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>

        <Field label="Width (cm)">
          <Input
            type="number" step="0.1" value={draft.widthCm}
            onChange={(e) => set("widthCm", +e.target.value)}
          />
        </Field>
        <Field label="Length (cm)">
          <Input
            type="number" step="0.1" value={draft.lengthCm}
            onChange={(e) => set("lengthCm", +e.target.value)}
          />
        </Field>

        <Field label="Roll position (m)">
          <Input
            type="number" step="0.1" value={draft.positionMeters}
            onChange={(e) => set("positionMeters", +e.target.value)}
          />
        </Field>
        <Field label="Model confidence" hint="0 – 1">
          <Input
            type="number" step="0.01" min="0" max="1" value={draft.confidence}
            onChange={(e) => set("confidence", +e.target.value)}
          />
        </Field>

        <Field label="Operator">
          <Input value={draft.operator} onChange={(e) => set("operator", e.target.value)} />
        </Field>
        <Field label="Shift">
          <Select value={draft.shift} onChange={(e) => set("shift", e.target.value as "A" | "B" | "C")}>
            <option value="A">A — 06:00–14:00</option>
            <option value="B">B — 14:00–22:00</option>
            <option value="C">C — 22:00–06:00</option>
          </Select>
        </Field>

        <Field label="Root cause" className="sm:col-span-2">
          <div className="flex gap-2">
            <Select
              value={draft.rootCause}
              onChange={(e) => set("rootCause", e.target.value)}
              className="flex-1"
            >
              {ROOT_CAUSES[draft.type].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => set("rootCause", inferRootCause(draft.type))}
            >
              Suggest
            </Button>
          </div>
        </Field>

        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </fieldset>

      <div className="mt-5 rounded-xl border border-teal/22 bg-teal/6 p-4">
        <p className="text-[11px] uppercase tracking-wider text-teal">Recalculated on save</p>
        <p className="mt-1.5 text-sm text-slate-300">
          Fabric loss{" "}
          <b className="text-white">
            {(((draft.widthCm * draft.lengthCm) / 900) *
              (draft.severity === "Critical" ? 1.6 : draft.severity === "Major" ? 0.7 : 0.22) +
              0.15
            ).toFixed(2)}{" "}
            m
          </b>{" "}
          · cost impact{" "}
          <b className="text-white">
            {money(
              (((draft.widthCm * draft.lengthCm) / 900) *
                (draft.severity === "Critical" ? 1.6 : draft.severity === "Major" ? 0.7 : 0.22) +
                0.15) *
                3.1,
              2,
            )}
          </b>{" "}
          at $3.10/m.
        </p>
      </div>
    </Modal>
  );
}
