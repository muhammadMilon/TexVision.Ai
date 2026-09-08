import type {
  AlertItem,
  AppState,
  Defect,
  DefectStatus,
  DefectType,
  IotDevice,
  Machine,
  ProductionLine,
  QcReport,
  Severity,
  User,
} from "./types";

/* Deterministic PRNG so server render and client hydration agree. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed anchor date - keeps every generated timestamp stable. */
export const ANCHOR = new Date("2026-09-08T18:30:00.000Z");

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const iso = (minutesAgo: number) =>
  new Date(ANCHOR.getTime() - minutesAgo * 60_000).toISOString();

/* ------------------------------------------------------------------ users */

export const USERS: User[] = [
  {
    id: "U-001",
    name: "Nusrat Jahan",
    email: "admin@texvision.ai",
    password: "admin123",
    role: "admin",
    department: "Plant Management",
    avatarColor: "#19c6ad",
    active: true,
    createdAt: iso(60 * 24 * 300),
  },
  {
    id: "U-002",
    name: "Rakibul Hasan",
    email: "manager@texvision.ai",
    password: "manager123",
    role: "manager",
    department: "Quality Assurance",
    avatarColor: "#f3ae43",
    active: true,
    createdAt: iso(60 * 24 * 210),
  },
  {
    id: "U-003",
    name: "Shamima Akter",
    email: "operator@texvision.ai",
    password: "operator123",
    role: "operator",
    department: "Knitting Floor 2",
    avatarColor: "#8d78eb",
    active: true,
    createdAt: iso(60 * 24 * 120),
  },
  {
    id: "U-004",
    name: "Buyer Portal (H&M Sourcing)",
    email: "buyer@texvision.ai",
    password: "buyer123",
    role: "viewer",
    department: "External Buyer Access",
    avatarColor: "#ea6571",
    active: true,
    createdAt: iso(60 * 24 * 45),
  },
];

/* ------------------------------------------------------------------ lines */

export const LINES: ProductionLine[] = [
  { id: "L-01", name: "Knitting Line A", floor: "Floor 2 - North", supervisor: "Rakibul Hasan" },
  { id: "L-02", name: "Knitting Line B", floor: "Floor 2 - South", supervisor: "Farhana Yeasmin" },
  { id: "L-03", name: "Finishing / Stenter", floor: "Floor 3", supervisor: "Imran Kabir" },
  { id: "L-04", name: "Denim Weaving", floor: "Floor 1", supervisor: "Tanvir Ahmed" },
];

/* --------------------------------------------------------------- machines */

export const MACHINES: Machine[] = [
  {
    id: "M-101", name: "Circular Knit CK-101", lineId: "L-01", type: "Circular Knitting",
    model: "Mayer & Cie Relanit 3.2", status: "Running", speedMpm: 42, fabricType: "Single Jersey 180 GSM",
    installedOn: "2023-04-11", lastServiceOn: "2026-08-14", operator: "Shamima Akter",
    healthScore: 92, totalMetersToday: 1840, defectRate: 1.4,
  },
  {
    id: "M-102", name: "Circular Knit CK-102", lineId: "L-01", type: "Circular Knitting",
    model: "Mayer & Cie Relanit 3.2", status: "Running", speedMpm: 39, fabricType: "Interlock 220 GSM",
    installedOn: "2023-04-11", lastServiceOn: "2026-07-02", operator: "Mim Chowdhury",
    healthScore: 74, totalMetersToday: 1610, defectRate: 3.1,
  },
  {
    id: "M-201", name: "Circular Knit CK-201", lineId: "L-02", type: "Circular Knitting",
    model: "Fukuhara V-LEC4BW", status: "Running", speedMpm: 45, fabricType: "Pique 200 GSM",
    installedOn: "2022-11-30", lastServiceOn: "2026-08-28", operator: "Jubayer Rahman",
    healthScore: 88, totalMetersToday: 2010, defectRate: 1.8,
  },
  {
    id: "M-202", name: "Circular Knit CK-202", lineId: "L-02", type: "Circular Knitting",
    model: "Fukuhara V-LEC4BW", status: "Maintenance", speedMpm: 0, fabricType: "Fleece 260 GSM",
    installedOn: "2022-11-30", lastServiceOn: "2026-09-06", operator: "Unassigned",
    healthScore: 51, totalMetersToday: 320, defectRate: 5.6,
  },
  {
    id: "M-301", name: "Stenter ST-301", lineId: "L-03", type: "Stenter",
    model: "Bruckner Power-Frame", status: "Running", speedMpm: 55, fabricType: "Mixed finishing",
    installedOn: "2021-06-22", lastServiceOn: "2026-08-19", operator: "Imran Kabir",
    healthScore: 81, totalMetersToday: 3400, defectRate: 2.2,
  },
  {
    id: "M-401", name: "Denim Loom DL-401", lineId: "L-04", type: "Weaving Loom",
    model: "Picanol OptiMax-i", status: "Idle", speedMpm: 0, fabricType: "Denim 12 oz",
    installedOn: "2024-02-09", lastServiceOn: "2026-08-30", operator: "Tanvir Ahmed",
    healthScore: 95, totalMetersToday: 780, defectRate: 0.9,
  },
];

/* ---------------------------------------------------------------- devices */

export const DEVICES: IotDevice[] = [
  {
    id: "D-001", name: "Edge Node - Line A", kind: "Edge AI Compute",
    hardware: "NVIDIA Jetson Orin Nano 8GB", machineId: "M-101", ip: "192.168.10.11",
    firmware: "TexOS 1.4.2", status: "Online", uptimePct: 99.4, tempC: 47, cpuPct: 63,
    latencyMs: 38, lastSeen: iso(1), protocol: "MQTT",
    notes: "Runs YOLOv10n-fabric-v3 at 60 fps, INT8 quantised. ~USD 249 per node.",
  },
  {
    id: "D-002", name: "Line-Scan Cam A1", kind: "Line-Scan Camera",
    hardware: "Basler racer raL2048-48gm", machineId: "M-101", ip: "192.168.10.21",
    firmware: "2.9.0", status: "Online", uptimePct: 99.9, tempC: 39, cpuPct: 0,
    latencyMs: 4, lastSeen: iso(1), protocol: "GigE Vision",
    notes: "2048 px line sensor, 48 kHz line rate, 1400 mm working width.",
  },
  {
    id: "D-003", name: "LED Bar A1", kind: "LED Ring Light",
    hardware: "Effilux EFFI-LINE 1200 mm", machineId: "M-101", ip: "192.168.10.31",
    firmware: "1.2.0", status: "Online", uptimePct: 100, tempC: 44, cpuPct: 0,
    latencyMs: 2, lastSeen: iso(2), protocol: "Modbus TCP",
    notes: "Diffuse white bar light, strobed in sync with the encoder.",
  },
  {
    id: "D-004", name: "Roll Encoder A1", kind: "Rotary Encoder",
    hardware: "Omron E6B2-CWZ6C (1000 P/R)", machineId: "M-101", ip: "192.168.10.41",
    firmware: "1.0.4", status: "Online", uptimePct: 99.8, tempC: 36, cpuPct: 0,
    latencyMs: 1, lastSeen: iso(1), protocol: "Modbus TCP",
    notes: "Gives every defect an exact metre position on the roll.",
  },
  {
    id: "D-005", name: "Andon Tower A", kind: "Signal Tower / Andon",
    hardware: "Patlite LR6 3-stack + buzzer", machineId: "M-101", ip: "192.168.10.51",
    firmware: "1.1.0", status: "Online", uptimePct: 100, tempC: 33, cpuPct: 0,
    latencyMs: 6, lastSeen: iso(3), protocol: "Modbus TCP",
    notes: "Red on Critical defect; relay can trigger machine auto-stop.",
  },
  {
    id: "D-006", name: "Edge Node - Line B", kind: "Edge AI Compute",
    hardware: "Raspberry Pi 5 + Hailo-8L (13 TOPS)", machineId: "M-201", ip: "192.168.10.12",
    firmware: "TexOS 1.4.2", status: "Online", uptimePct: 98.1, tempC: 58, cpuPct: 78,
    latencyMs: 44, lastSeen: iso(1), protocol: "MQTT",
    notes: "Low-cost variant for retrofit onto older machine frames. ~USD 180 per node.",
  },
  {
    id: "D-007", name: "Area Cam B1", kind: "Area-Scan Camera",
    hardware: "Hikrobot MV-CS060-10GM", machineId: "M-201", ip: "192.168.10.22",
    firmware: "3.1.2", status: "Degraded", uptimePct: 91.2, tempC: 51, cpuPct: 0,
    latencyMs: 9, lastSeen: iso(6), protocol: "GigE Vision",
    notes: "Lens needs cleaning - lint build-up reducing contrast.",
  },
  {
    id: "D-008", name: "Env Sensor Floor 2", kind: "Environment Sensor",
    hardware: "ESP32-S3 + SHT41 + PMS5003", machineId: "M-202", ip: "192.168.10.61",
    firmware: "0.9.7", status: "Online", uptimePct: 97.6, tempC: 34, cpuPct: 12,
    latencyMs: 120, lastSeen: iso(2), protocol: "MQTT",
    notes: "Temperature, humidity and lint-dust density - correlated with defect spikes.",
  },
  {
    id: "D-009", name: "Edge Node - Stenter", kind: "Edge AI Compute",
    hardware: "NVIDIA Jetson Orin NX 16GB", machineId: "M-301", ip: "192.168.10.13",
    firmware: "TexOS 1.4.1", status: "Online", uptimePct: 99.0, tempC: 62, cpuPct: 71,
    latencyMs: 41, lastSeen: iso(1), protocol: "MQTT",
    notes: "Handles 55 m/min finishing speed with dual camera input.",
  },
  {
    id: "D-010", name: "PLC Bridge Floor 3", kind: "PLC Relay Module",
    hardware: "Siemens S7-1200 + IOT2050 bridge", machineId: "M-301", ip: "192.168.10.71",
    firmware: "4.5.0", status: "Online", uptimePct: 99.7, tempC: 41, cpuPct: 22,
    latencyMs: 12, lastSeen: iso(4), protocol: "OPC-UA",
    notes: "Auto-stop interlock; also reads machine speed from the drive.",
  },
  {
    id: "D-011", name: "Floor Gateway", kind: "Network Gateway",
    hardware: "Teltonika RUT956 (4G failover)", machineId: "M-401", ip: "192.168.10.1",
    firmware: "7.9.3", status: "Online", uptimePct: 99.9, tempC: 45, cpuPct: 31,
    latencyMs: 18, lastSeen: iso(1), protocol: "HTTP",
    notes: "Syncs lightweight defect metadata only - video never leaves the floor.",
  },
  {
    id: "D-012", name: "Edge Node - Denim", kind: "Edge AI Compute",
    hardware: "NVIDIA Jetson Orin Nano 8GB", machineId: "M-401", ip: "192.168.10.14",
    firmware: "TexOS 1.3.9", status: "Offline", uptimePct: 88.4, tempC: 28, cpuPct: 0,
    latencyMs: 0, lastSeen: iso(184), protocol: "MQTT",
    notes: "Powered down - denim model still in fine-tuning.",
  },
];

/* ---------------------------------------------------------------- defects */

const DEFECT_TYPES: DefectType[] = [
  "Hole", "Yarn Break", "Oil Stain", "Colour Shift", "Knitting Irregularity", "Slub", "Misalignment",
];

export const ROOT_CAUSES: Record<DefectType, string[]> = {
  Hole: ["Broken needle in cylinder", "Excessive yarn tension", "Damaged sinker"],
  "Yarn Break": ["Low yarn strength / weak splice", "Creel tension imbalance", "Feeder eyelet wear"],
  "Oil Stain": ["Over-lubricated cylinder", "Leaking needle-oil line", "Manual handling contamination"],
  "Colour Shift": ["Dye lot change mid-roll", "Stenter temperature drift", "Uneven padder pressure"],
  "Knitting Irregularity": ["Cam setting drift", "Worn needle latch", "Inconsistent stitch length"],
  Slub: ["Yarn count variation", "Contaminated bale in blend", "Spinning frame irregularity"],
  Misalignment: ["Fabric spreader misadjusted", "Selvedge guide slip", "Uneven take-down tension"],
};

const OPERATORS = [
  "Shamima Akter", "Mim Chowdhury", "Jubayer Rahman", "Imran Kabir", "Tanvir Ahmed", "Rumana Begum",
];
const STATUSES: DefectStatus[] = ["Open", "Under Review", "Resolved", "Resolved", "False Positive"];

function severityFor(type: DefectType, rand: () => number): Severity {
  const weights: Record<DefectType, number> = {
    Hole: 0.75, "Yarn Break": 0.55, "Oil Stain": 0.45, "Colour Shift": 0.4,
    "Knitting Irregularity": 0.35, Slub: 0.2, Misalignment: 0.3,
  };
  const r = rand() * (0.5 + weights[type]);
  if (r > 0.72) return "Critical";
  if (r > 0.38) return "Major";
  return "Minor";
}

export function generateDefects(count = 320): Defect[] {
  const rand = mulberry32(20260908);
  const out: Defect[] = [];

  for (let i = 0; i < count; i++) {
    const machine = pick(rand, MACHINES);
    // Healthy machines produce proportionally fewer records.
    if (machine.healthScore > 85 && rand() > 0.55) continue;

    const type = pick(rand, DEFECT_TYPES);
    const severity = severityFor(type, rand);
    const minutesAgo = Math.floor(rand() * 60 * 24 * 14);
    const widthCm = +(1 + rand() * 11).toFixed(1);
    const lengthCm = +(1 + rand() * 26).toFixed(1);
    const lossFactor = severity === "Critical" ? 1.6 : severity === "Major" ? 0.7 : 0.22;
    const fabricLossMeters = +(((widthCm * lengthCm) / 900) * lossFactor + 0.15).toFixed(2);

    out.push({
      id: `DF-${1000 + i}`,
      code: `${machine.id}-${(1000 + i).toString(36).toUpperCase()}`,
      detectedAt: iso(minutesAgo),
      machineId: machine.id,
      lineId: machine.lineId,
      type,
      severity,
      status: pick(rand, STATUSES),
      confidence: +(0.71 + rand() * 0.28).toFixed(3),
      positionMeters: +(rand() * 1800).toFixed(1),
      widthCm,
      lengthCm,
      fabricLossMeters,
      costImpactUsd: +(fabricLossMeters * (2.1 + rand() * 1.9)).toFixed(2),
      operator: pick(rand, OPERATORS),
      shift: (["A", "B", "C"] as const)[Math.floor((minutesAgo % 1440) / 480)],
      rootCause: pick(rand, ROOT_CAUSES[type]),
      notes: "",
      imageSeed: Math.floor(rand() * 100000),
    });
  }
  return out.sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
}

/* ---------------------------------------------------------------- reports */

export const REPORTS: QcReport[] = [
  {
    id: "QC-2041", title: "Weekly AQL Roll Inspection - Knitting Line A", buyer: "H&M",
    lineId: "L-01", periodFrom: "2026-09-01", periodTo: "2026-09-07", createdAt: iso(60 * 12),
    status: "Sent to Buyer", aqlLevel: "2.5", inspectedMeters: 12400, defectCount: 148,
    pointsPer100m: 18.4, verdict: "Pass", wasteMeters: 96.4, costImpactUsd: 284.7,
    author: "Rakibul Hasan",
    summary:
      "Line A held 18.4 points/100 m against a 20-point buyer threshold. Yarn breaks on CK-102 account for 41% of recorded points; a needle inspection is scheduled.",
  },
  {
    id: "QC-2040", title: "Shift-Close QC Summary - Knitting Line B", buyer: "Internal",
    lineId: "L-02", periodFrom: "2026-09-06", periodTo: "2026-09-06", createdAt: iso(60 * 30),
    status: "Approved", aqlLevel: "2.5", inspectedMeters: 3900, defectCount: 71,
    pointsPer100m: 24.9, verdict: "Conditional", wasteMeters: 51.2, costImpactUsd: 158.3,
    author: "Nusrat Jahan",
    summary:
      "CK-202 exceeded the internal threshold before being pulled for maintenance. Root-cause clustering points to cam setting drift after the 06 Sep service.",
  },
  {
    id: "QC-2039", title: "Finishing Line Shade Consistency Report", buyer: "Zara",
    lineId: "L-03", periodFrom: "2026-08-25", periodTo: "2026-09-01", createdAt: iso(60 * 96),
    status: "Generated", aqlLevel: "1.5", inspectedMeters: 21800, defectCount: 96,
    pointsPer100m: 9.1, verdict: "Pass", wasteMeters: 42.8, costImpactUsd: 121.9,
    author: "Imran Kabir",
    summary:
      "Colour-shift events dropped 34% week-over-week after stenter chamber 3 temperature was recalibrated on 27 Aug.",
  },
  {
    id: "QC-2038", title: "Denim Pilot - Baseline Defect Study", buyer: "Levi Strauss",
    lineId: "L-04", periodFrom: "2026-08-18", periodTo: "2026-08-24", createdAt: iso(60 * 200),
    status: "Draft", aqlLevel: "4.0", inspectedMeters: 5600, defectCount: 34,
    pointsPer100m: 6.2, verdict: "Pass", wasteMeters: 14.1, costImpactUsd: 63.4,
    author: "Tanvir Ahmed",
    summary:
      "Baseline capture for the denim detector fine-tune. Model currently runs in shadow mode - no operator alerts issued.",
  },
];

/* ----------------------------------------------------------------- alerts */

export const ALERTS: AlertItem[] = [
  {
    id: "AL-01", at: iso(4), level: "Critical",
    title: "Critical hole cluster on CK-102",
    message: "3 holes detected within 6 m at 1,204 m. Auto-stop signal sent to the Andon tower.",
    machineId: "M-102", acknowledged: false,
  },
  {
    id: "AL-02", at: iso(19), level: "Warning",
    title: "Camera B1 contrast degraded",
    message: "Area Cam B1 image contrast is 22% below baseline - lens cleaning recommended.",
    machineId: "M-201", acknowledged: false,
  },
  {
    id: "AL-03", at: iso(46), level: "Warning",
    title: "Defect rate above threshold - CK-202",
    message: "5.6 defects/100 m over the last hour against a 3.0 threshold.",
    machineId: "M-202", acknowledged: true,
  },
  {
    id: "AL-04", at: iso(132), level: "Info",
    title: "Model update deployed",
    message: "yolov10n-fabric-v3.1 rolled out to 4 edge nodes. Recall improved 1.8 pts on oil stains.",
    machineId: "M-101", acknowledged: true,
  },
  {
    id: "AL-05", at: iso(184), level: "Critical",
    title: "Edge node offline - Denim",
    message: "D-012 has not reported for 3 h. The denim line is running without inspection coverage.",
    machineId: "M-401", acknowledged: false,
  },
];

export function buildInitialState(): AppState {
  return {
    users: USERS,
    lines: LINES,
    machines: MACHINES,
    devices: DEVICES,
    defects: generateDefects(),
    reports: REPORTS,
    alerts: ALERTS,
    chat: [],
  };
}
