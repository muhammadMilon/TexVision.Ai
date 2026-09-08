"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Camera, Cpu, Gauge, Lightbulb, Pencil, Plus, Radio, RefreshCw, Router, Siren,
  Thermometer, Trash2, Wifi,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { NOW } from "@/lib/analytics";
import {
  Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeading, Select, Textarea, statusTone,
} from "@/components/ui";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { cn, timeAgo } from "@/lib/utils";
import type { DeviceKind, DeviceStatus, IotDevice } from "@/lib/types";

const KINDS: DeviceKind[] = [
  "Edge AI Compute", "Line-Scan Camera", "Area-Scan Camera", "LED Ring Light", "Rotary Encoder",
  "Signal Tower / Andon", "Environment Sensor", "PLC Relay Module", "Network Gateway",
];
const STATUSES: DeviceStatus[] = ["Online", "Offline", "Degraded", "Provisioning"];
const PROTOCOLS: IotDevice["protocol"][] = ["MQTT", "Modbus TCP", "GigE Vision", "OPC-UA", "HTTP"];

const KIND_ICON: Record<DeviceKind, React.ElementType> = {
  "Edge AI Compute": Cpu,
  "Line-Scan Camera": Camera,
  "Area-Scan Camera": Camera,
  "LED Ring Light": Lightbulb,
  "Rotary Encoder": Gauge,
  "Signal Tower / Andon": Siren,
  "Environment Sensor": Thermometer,
  "PLC Relay Module": Radio,
  "Network Gateway": Router,
};

const blank = (machineId: string): IotDevice => ({
  id: "",
  name: "",
  kind: "Edge AI Compute",
  hardware: "",
  machineId,
  ip: "192.168.10.",
  firmware: "TexOS 1.4.2",
  status: "Provisioning",
  uptimePct: 100,
  tempC: 35,
  cpuPct: 0,
  latencyMs: 40,
  lastSeen: new Date().toISOString(),
  protocol: "MQTT",
  notes: "",
});

export default function DevicesPage() {
  const { devices, machines, addDevice, updateDevice, removeDevice, currentUser } = useStore();
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "manager";

  const [editing, setEditing] = useState<IotDevice | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<IotDevice | null>(null);
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* Live telemetry jitter so the fleet view feels like a real MQTT feed. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 3000);
    return () => window.clearInterval(t);
  }, []);

  const jitter = useMemo(() => {
    const map = new Map<string, { tempC: number; cpuPct: number; latencyMs: number }>();
    for (const d of devices) {
      if (d.status === "Offline") {
        map.set(d.id, { tempC: d.tempC, cpuPct: 0, latencyMs: 0 });
        continue;
      }
      const wobble = (base: number, amp: number) =>
        Math.max(0, +(base + Math.sin((tick + base) / 2) * amp).toFixed(0));
      map.set(d.id, {
        tempC: wobble(d.tempC, 2),
        cpuPct: Math.min(99, wobble(d.cpuPct, 6)),
        latencyMs: wobble(d.latencyMs, 3),
      });
    }
    return map;
  }, [devices, tick]);

  const filtered = useMemo(
    () =>
      devices.filter(
        (d) =>
          (kindFilter === "all" || d.kind === kindFilter) &&
          (statusFilter === "all" || d.status === statusFilter),
      ),
    [devices, kindFilter, statusFilter],
  );

  const summary = useMemo(() => {
    const online = devices.filter((d) => d.status === "Online");
    return {
      total: devices.length,
      online: online.length,
      degraded: devices.filter((d) => d.status === "Degraded").length,
      offline: devices.filter((d) => d.status === "Offline").length,
      avgUptime: devices.length
        ? devices.reduce((s, d) => s + d.uptimePct, 0) / devices.length
        : 0,
      avgLatency: online.length
        ? online.reduce((s, d) => s + d.latencyMs, 0) / online.length
        : 0,
    };
  }, [devices]);

  const columns: Column<IotDevice>[] = [
    {
      key: "name",
      header: "Device",
      sortValue: (d) => d.name,
      cell: (d) => {
        const Icon = KIND_ICON[d.kind];
        return (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                d.status === "Online"
                  ? "bg-teal/12 text-teal"
                  : d.status === "Degraded"
                    ? "bg-amber/12 text-amber"
                    : "bg-white/5 text-slate-500",
              )}
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{d.name}</p>
              <p className="truncate font-mono text-[11px] text-slate-500">{d.hardware}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "kind",
      header: "Type",
      sortValue: (d) => d.kind,
      cell: (d) => <span className="text-[12px] text-slate-300">{d.kind}</span>,
    },
    {
      key: "machine",
      header: "Attached to",
      sortValue: (d) => d.machineId,
      cell: (d) => (
        <span className="font-mono text-[12px] text-slate-400">
          {machines.find((m) => m.id === d.machineId)?.name ?? d.machineId}
        </span>
      ),
    },
    {
      key: "net",
      header: "Network",
      cell: (d) => (
        <div>
          <p className="font-mono text-[12px] text-slate-300">{d.ip}</p>
          <p className="font-mono text-[11px] text-slate-500">{d.protocol}</p>
        </div>
      ),
    },
    {
      key: "telemetry",
      header: "Telemetry",
      align: "right",
      cell: (d) => {
        const t = jitter.get(d.id);
        if (d.status === "Offline")
          return <span className="font-mono text-[12px] text-slate-600">no signal</span>;
        return (
          <div className="font-mono text-[11px] text-slate-400">
            <p>
              <span className="text-white">{t?.tempC ?? d.tempC}°C</span> · {t?.cpuPct ?? d.cpuPct}% cpu
            </p>
            <p>{t?.latencyMs ?? d.latencyMs} ms · {d.uptimePct}% up</p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (d) => d.status,
      cell: (d) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={statusTone(d.status)}>
            {d.status === "Online" ? (
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-teal" />
            ) : null}
            {d.status}
          </Badge>
          <span className="font-mono text-[10px] text-slate-600">
            {timeAgo(d.lastSeen, NOW)}
          </span>
        </div>
      ),
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
            aria-label="Edit device"
          >
            <Pencil size={14} />
          </button>
          {canEdit ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(d); }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-[#e05c68]"
              aria-label="Remove device"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Factory"
        title="IoT device fleet"
        description="Every physical device the system needs, and what each is doing right now. This is the whole bill of materials — commodity industrial parts, no custom hardware."
        action={
          canEdit ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={15} /> Provision device
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Devices online", `${summary.online}/${summary.total}`, "#00ab95"],
          ["Degraded", summary.degraded.toString(), "#c38302"],
          ["Offline", summary.offline.toString(), "#d04d5b"],
          ["Mean inference latency", `${summary.avgLatency.toFixed(0)} ms`, "#4385c0"],
        ].map(([l, v, c], i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e2033]/70 p-5"
          >
            <span
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${c},transparent)` }}
            />
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{l}</p>
            <p className="mt-2 font-display text-2xl font-bold text-white">{v}</p>
          </motion.div>
        ))}
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <Select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="w-auto min-w-52"
        >
          <option value="all">All device types</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-40"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          <RefreshCw size={12} className="animate-spin [animation-duration:3s]" />
          telemetry refreshing every 3 s
        </span>
      </Card>

      <Card>
        <DataTable
          rows={filtered}
          columns={columns}
          pageSize={12}
          emptyMessage="No devices match these filters."
          onRowClick={(d) => setEditing(d)}
        />
      </Card>

      {/* --------------------------------------------- BOM explainer card */}
      <Card className="mt-4">
        <CardHeader
          title="What one inspection point costs"
          subtitle="Per-machine hardware, at list prices from standard industrial suppliers"
        />
        <div className="grid gap-3 p-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Edge AI compute", "Jetson Orin Nano 8GB / Pi 5 + Hailo-8L", "$180 – $249"],
            ["Inspection camera", "Basler racer line-scan or Hikrobot area-scan", "$140 – $320"],
            ["LED bar light", "Effilux EFFI-LINE 1200 mm diffuse", "$60 – $110"],
            ["Rotary encoder", "Omron E6B2-CWZ6C, 1000 P/R", "$25 – $45"],
            ["Andon tower + relay", "Patlite LR6 3-stack with buzzer", "$35 – $70"],
            ["Mounting & cabling", "Bracket, PoE/GigE run, enclosure", "$40 – $90"],
          ].map(([name, part, price]) => (
            <div key={name} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <p className="text-[13px] font-semibold text-white">{name}</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-teal/80">{part}</p>
              <p className="mt-2.5 font-mono text-[13px] text-white">{price}</p>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-teal/22 bg-teal/6 p-4">
          <Wifi size={18} className="shrink-0 text-teal" />
          <p className="text-[13px] leading-relaxed text-slate-300">
            Roughly <b className="text-white">$520 per machine</b>, plus one shared gateway router
            and PLC bridge per floor. An imported automated inspection line for the same job is
            quoted at <b className="text-white">$40,000–$100,000</b>.
          </p>
        </div>
      </Card>

      <DeviceForm
        open={!!editing}
        device={editing}
        machines={machines}
        readOnly={!canEdit}
        onClose={() => setEditing(null)}
        onSave={(d) => {
          updateDevice(d.id, d);
          setEditing(null);
        }}
      />
      <DeviceForm
        open={creating}
        device={creating ? blank(machines[0]?.id ?? "M-101") : null}
        machines={machines}
        isNew
        onClose={() => setCreating(false)}
        onSave={(d) => {
          addDevice({ ...d, id: d.id || `D-${Math.floor(Math.random() * 800 + 100)}` });
          setCreating(false);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Decommission this device?"
        subtitle={confirmDelete?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) removeDevice(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={15} /> Decommission
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-400">
          If this is the edge node for its machine, that inspection point will lose detection
          coverage until another node is provisioned.
        </p>
      </Modal>
    </div>
  );
}

function DeviceForm({
  open, device, machines, isNew, readOnly, onClose, onSave,
}: {
  open: boolean;
  device: IotDevice | null;
  machines: { id: string; name: string }[];
  isNew?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (d: IotDevice) => void;
}) {
  const [draft, setDraft] = useState<IotDevice | null>(device);
  const [key, setKey] = useState("");
  const identity = `${device?.id}-${open}`;
  if (identity !== key) {
    setKey(identity);
    setDraft(device);
  }
  if (!draft) return null;

  const set = <K extends keyof IotDevice>(k: K, v: IotDevice[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isNew ? "Provision a device" : draft.name}
      subtitle={isNew ? "Register a new node on the factory network." : draft.hardware}
      footer={
        readOnly ? (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(draft)}>
              {isNew ? "Provision device" : "Save changes"}
            </Button>
          </>
        )
      }
    >
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field label="Device name">
          <Input
            value={draft.name}
            placeholder="Edge Node - Line C"
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Device type">
          <Select value={draft.kind} onChange={(e) => set("kind", e.target.value as DeviceKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <Field label="Hardware part" className="sm:col-span-2">
          <Input
            value={draft.hardware}
            placeholder="NVIDIA Jetson Orin Nano 8GB"
            onChange={(e) => set("hardware", e.target.value)}
          />
        </Field>
        <Field label="Attached machine">
          <Select value={draft.machineId} onChange={(e) => set("machineId", e.target.value)}>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={(e) => set("status", e.target.value as DeviceStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="IP address">
          <Input value={draft.ip} onChange={(e) => set("ip", e.target.value)} />
        </Field>
        <Field label="Protocol">
          <Select
            value={draft.protocol}
            onChange={(e) => set("protocol", e.target.value as IotDevice["protocol"])}
          >
            {PROTOCOLS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Firmware">
          <Input value={draft.firmware} onChange={(e) => set("firmware", e.target.value)} />
        </Field>
        <Field label="Uptime (%)">
          <Input
            type="number" step="0.1" min="0" max="100" value={draft.uptimePct}
            onChange={(e) => set("uptimePct", +e.target.value)}
          />
        </Field>
        <Field label="Temperature (°C)">
          <Input
            type="number" value={draft.tempC}
            onChange={(e) => set("tempC", +e.target.value)}
          />
        </Field>
        <Field label="Inference latency (ms)">
          <Input
            type="number" value={draft.latencyMs}
            onChange={(e) => set("latencyMs", +e.target.value)}
          />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </fieldset>
    </Modal>
  );
}
