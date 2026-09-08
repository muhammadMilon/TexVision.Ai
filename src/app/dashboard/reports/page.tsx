"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Download, FileText, Pencil, Send, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateReportDraft, reportToText } from "@/lib/ai";
import {
  Badge, Button, Card, Field, Input, Modal, PageHeading, Select, Textarea, statusTone,
} from "@/components/ui";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { downloadText, formatDate, money, num } from "@/lib/utils";
import type { QcReport, ReportStatus } from "@/lib/types";

const STATUSES: ReportStatus[] = ["Draft", "Generated", "Approved", "Sent to Buyer"];
const BUYERS = ["H&M", "Zara", "Levi Strauss", "Primark", "Uniqlo", "Internal"];

export default function ReportsPage() {
  const { reports, lines, machines, defects, addReport, updateReport, removeReport, currentUser } =
    useStore();
  const canEdit = currentUser?.role !== "viewer";

  const [genOpen, setGenOpen] = useState(false);
  const [viewing, setViewing] = useState<QcReport | null>(null);
  const [editing, setEditing] = useState<QcReport | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<QcReport | null>(null);

  const lineName = (id: string) => lines.find((l) => l.id === id)?.name ?? id;

  const totals = useMemo(
    () => ({
      total: reports.length,
      sent: reports.filter((r) => r.status === "Sent to Buyer").length,
      failing: reports.filter((r) => r.verdict !== "Pass").length,
      cost: reports.reduce((s, r) => s + r.costImpactUsd, 0),
    }),
    [reports],
  );

  const columns: Column<QcReport>[] = [
    {
      key: "title",
      header: "Report",
      sortValue: (r) => r.title,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
            <FileText size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{r.title}</p>
            <p className="font-mono text-[11px] text-slate-500">
              {r.id} · {lineName(r.lineId)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      sortValue: (r) => r.buyer,
      cell: (r) => <span className="text-[13px] text-slate-300">{r.buyer}</span>,
    },
    {
      key: "period",
      header: "Period",
      sortValue: (r) => r.periodFrom,
      cell: (r) => (
        <span className="font-mono text-[11px] text-slate-400">
          {formatDate(r.periodFrom)} → {formatDate(r.periodTo)}
        </span>
      ),
    },
    {
      key: "points",
      header: "Points / 100 m",
      sortValue: (r) => r.pointsPer100m,
      align: "right",
      cell: (r) => (
        <span className="font-mono text-[13px] text-white">{r.pointsPer100m}</span>
      ),
    },
    {
      key: "verdict",
      header: "Verdict",
      sortValue: (r) => r.verdict,
      cell: (r) => <Badge tone={statusTone(r.verdict)}>{r.verdict}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); downloadText(`${r.id}.txt`, reportToText(r, lineName(r.lineId))); }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-teal"
            aria-label="Download report"
          >
            <Download size={14} />
          </button>
          {canEdit ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(r); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-teal"
                aria-label="Edit report"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-[#e05c68]"
                aria-label="Delete report"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Compliance"
        title="QC reports"
        description="The last stage of the workflow. Detections are scored on the four-point (ASTM D5430) scale, summarised, given a Pass / Conditional / Fail verdict, and exported in a form a buyer's auditor can read."
        action={
          canEdit ? (
            <Button onClick={() => setGenOpen(true)}>
              <Sparkles size={15} /> Generate with AI
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Reports", num(totals.total)],
          ["Sent to buyers", num(totals.sent)],
          ["Not a clean pass", num(totals.failing)],
          ["Cost documented", money(totals.cost, 2)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-[#0e2033]/70 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
            <p className="mt-1.5 font-display text-xl font-bold text-white">{v}</p>
          </div>
        ))}
      </div>

      <Card>
        <DataTable
          rows={reports}
          columns={columns}
          pageSize={10}
          emptyMessage="No reports yet — generate one."
          onRowClick={(r) => setViewing(r)}
        />
      </Card>

      {/* --------------------------------------------------- generator */}
      <GenerateModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        lines={lines}
        onCreate={(r) => {
          addReport(r);
          setGenOpen(false);
          setViewing(r);
        }}
        build={(lineId, days, aql) => generateReportDraft(defects, machines, lineId, days, aql)}
        author={currentUser?.name ?? "TexVision"}
        nextId={`QC-${2042 + reports.length}`}
      />

      {/* ------------------------------------------------------- viewer */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        wide
        title={viewing?.title ?? ""}
        subtitle={viewing ? `${viewing.id} · ${viewing.buyer} · ${lineName(viewing.lineId)}` : ""}
        footer={
          viewing ? (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  downloadText(`${viewing.id}.txt`, reportToText(viewing, lineName(viewing.lineId)))
                }
              >
                <Download size={15} /> Download
              </Button>
              {canEdit && viewing.status !== "Sent to Buyer" ? (
                <Button
                  onClick={() => {
                    updateReport(viewing.id, { status: "Sent to Buyer" });
                    setViewing({ ...viewing, status: "Sent to Buyer" });
                  }}
                >
                  <Send size={15} /> Send to buyer
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {viewing ? (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Period", `${formatDate(viewing.periodFrom)} → ${formatDate(viewing.periodTo)}`],
                ["AQL level", viewing.aqlLevel],
                ["Inspected", `${num(viewing.inspectedMeters)} m`],
                ["Defects", num(viewing.defectCount)],
                ["Points / 100 m", viewing.pointsPer100m.toString()],
                ["Fabric loss", `${viewing.wasteMeters} m`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                  <p className="mt-0.5 font-mono text-[13px] text-white">{v}</p>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 flex items-center gap-4 rounded-xl border p-4 ${
                viewing.verdict === "Pass"
                  ? "border-teal/30 bg-teal/8"
                  : viewing.verdict === "Conditional"
                    ? "border-amber/30 bg-amber/8"
                    : "border-[#e05c68]/30 bg-[#e05c68]/8"
              }`}
            >
              <span className="font-display text-2xl font-bold text-white">{viewing.verdict}</span>
              <p className="text-[13px] leading-relaxed text-slate-300">
                Scored {viewing.pointsPer100m} points per 100 m against the AQL{" "}
                {viewing.aqlLevel} threshold. Cost impact {money(viewing.costImpactUsd, 2)}.
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal">
                AI-written summary
              </p>
              <p className="rounded-xl border border-white/8 bg-white/3 p-4 text-[14px] leading-relaxed text-slate-300">
                {viewing.summary}
              </p>
            </div>

            <p className="mt-4 font-mono text-[11px] text-slate-500">
              Prepared by {viewing.author} · created {formatDate(viewing.createdAt)} · status{" "}
              {viewing.status}
            </p>
          </div>
        ) : null}
      </Modal>

      {/* --------------------------------------------------- edit modal */}
      <EditModal
        open={!!editing}
        report={editing}
        lines={lines}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          updateReport(r.id, r);
          setEditing(null);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this report?"
        subtitle={confirmDelete?.id}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) removeReport(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={15} /> Delete report
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          A report already sent to a buyer should normally be superseded by a new revision rather
          than deleted, so the audit trail stays intact.
        </p>
      </Modal>
    </div>
  );
}

/* --------------------------------------------------------------- generator */

function GenerateModal({
  open, onClose, lines, onCreate, build, author, nextId,
}: {
  open: boolean;
  onClose: () => void;
  lines: { id: string; name: string }[];
  onCreate: (r: QcReport) => void;
  build: (lineId: string, days: number, aql: string) => ReturnType<typeof generateReportDraft>;
  author: string;
  nextId: string;
}) {
  const [lineId, setLineId] = useState("L-01");
  const [days, setDays] = useState(7);
  const [aql, setAql] = useState<"1.5" | "2.5" | "4.0">("2.5");
  const [buyer, setBuyer] = useState("H&M");
  const [stage, setStage] = useState<"form" | "working" | "done">("form");
  const [draft, setDraft] = useState<ReturnType<typeof generateReportDraft> | null>(null);

  const steps = [
    "Reading detections for the selected window",
    "Scoring each defect on the four-point scale",
    "Clustering root causes by machine",
    "Costing fabric loss",
    "Writing the summary",
  ];
  const [step, setStep] = useState(0);

  function run() {
    setStage("working");
    setStep(0);
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= steps.length) {
        window.clearInterval(iv);
        setDraft(build(lineId, days, aql));
        setStage("done");
      }
    }, 420);
  }

  function reset() {
    setStage("form");
    setDraft(null);
    setStep(0);
  }

  function create() {
    if (!draft) return;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    onCreate({
      id: nextId,
      title: `${days === 1 ? "Shift-close" : `${days}-day`} QC report — ${
        lines.find((l) => l.id === lineId)?.name ?? lineId
      }`,
      buyer,
      lineId,
      periodFrom: from.toISOString().slice(0, 10),
      periodTo: to.toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      status: "Generated",
      aqlLevel: aql,
      inspectedMeters: draft.inspectedMeters,
      defectCount: draft.defectCount,
      pointsPer100m: draft.pointsPer100m,
      verdict: draft.verdict,
      wasteMeters: draft.wasteMeters,
      costImpactUsd: draft.costImpactUsd,
      summary: draft.summary,
      author,
    });
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      wide
      title="Generate a QC report"
      subtitle="Scores every detection in the window and writes the buyer-facing summary."
      footer={
        stage === "done" ? (
          <>
            <Button variant="ghost" onClick={reset}>Start over</Button>
            <Button onClick={create}>Save report</Button>
          </>
        ) : stage === "form" ? (
          <>
            <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Cancel</Button>
            <Button onClick={run}>
              <Sparkles size={15} /> Generate
            </Button>
          </>
        ) : null
      }
    >
      {stage === "form" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Production line">
            <Select value={lineId} onChange={(e) => setLineId(e.target.value)}>
              <option value="all">All lines</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Buyer">
            <Select value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {BUYERS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Reporting period">
            <Select value={days} onChange={(e) => setDays(+e.target.value)}>
              <option value={1}>Last shift (24 h)</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
            </Select>
          </Field>
          <Field label="AQL level" hint="Threshold: 1.5 → 15 pts, 2.5 → 20 pts, 4.0 → 28 pts">
            <Select
              value={aql}
              onChange={(e) => setAql(e.target.value as "1.5" | "2.5" | "4.0")}
            >
              <option value="1.5">AQL 1.5 — strict</option>
              <option value="2.5">AQL 2.5 — standard</option>
              <option value="4.0">AQL 4.0 — relaxed</option>
            </Select>
          </Field>
        </div>
      ) : null}

      {stage === "working" ? (
        <div className="space-y-3 py-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                  i < step
                    ? "bg-teal text-[#04231f]"
                    : i === step
                      ? "bg-teal/20 text-teal"
                      : "bg-white/6 text-slate-600"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span
                className={`text-[13px] ${i <= step ? "text-slate-200" : "text-slate-600"}`}
              >
                {s}
              </span>
              {i === step ? (
                <motion.span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-teal"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {stage === "done" && draft ? (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Inspected", `${num(draft.inspectedMeters)} m`],
              ["Defects", num(draft.defectCount)],
              ["Points / 100 m", draft.pointsPer100m.toString()],
              ["Verdict", draft.verdict],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
                <p className="mt-0.5 font-mono text-[13px] text-white">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal">
            Generated summary
          </p>
          <p className="rounded-xl border border-white/8 bg-white/3 p-4 text-[14px] leading-relaxed text-slate-300">
            {draft.summary}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

/* -------------------------------------------------------------- edit modal */

function EditModal({
  open, report, lines, onClose, onSave,
}: {
  open: boolean;
  report: QcReport | null;
  lines: { id: string; name: string }[];
  onClose: () => void;
  onSave: (r: QcReport) => void;
}) {
  const [draft, setDraft] = useState<QcReport | null>(report);
  const [key, setKey] = useState("");
  const identity = `${report?.id}-${open}`;
  if (identity !== key) {
    setKey(identity);
    setDraft(report);
  }
  if (!draft) return null;

  const set = <K extends keyof QcReport>(k: K, v: QcReport[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Edit report"
      subtitle={draft.id}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save changes</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Buyer">
          <Select value={draft.buyer} onChange={(e) => set("buyer", e.target.value)}>
            {BUYERS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Line">
          <Select value={draft.lineId} onChange={(e) => set("lineId", e.target.value)}>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ReportStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Verdict">
          <Select
            value={draft.verdict}
            onChange={(e) => set("verdict", e.target.value as QcReport["verdict"])}
          >
            {(["Pass", "Conditional", "Fail"] as const).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Period from">
          <Input
            type="date" value={draft.periodFrom}
            onChange={(e) => set("periodFrom", e.target.value)}
          />
        </Field>
        <Field label="Period to">
          <Input
            type="date" value={draft.periodTo}
            onChange={(e) => set("periodTo", e.target.value)}
          />
        </Field>
        <Field label="Summary" className="sm:col-span-2">
          <Textarea
            value={draft.summary}
            className="min-h-36"
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
