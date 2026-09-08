export type Role = "admin" | "manager" | "operator" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  avatarColor: string;
  active: boolean;
  createdAt: string;
}

export type DefectType =
  | "Hole"
  | "Yarn Break"
  | "Oil Stain"
  | "Colour Shift"
  | "Knitting Irregularity"
  | "Slub"
  | "Misalignment";

export type Severity = "Critical" | "Major" | "Minor";
export type DefectStatus = "Open" | "Under Review" | "Resolved" | "False Positive";

export interface Defect {
  id: string;
  code: string;
  detectedAt: string;
  machineId: string;
  lineId: string;
  type: DefectType;
  severity: Severity;
  status: DefectStatus;
  confidence: number;      // 0-1 model confidence
  positionMeters: number;  // where on the roll
  widthCm: number;
  lengthCm: number;
  fabricLossMeters: number;
  costImpactUsd: number;
  operator: string;
  shift: "A" | "B" | "C";
  rootCause: string;
  notes: string;
  imageSeed: number;
}

export type MachineStatus = "Running" | "Idle" | "Maintenance" | "Stopped";

export interface Machine {
  id: string;
  name: string;
  lineId: string;
  type: "Circular Knitting" | "Stenter" | "Weaving Loom" | "Inspection Table" | "Dyeing Range";
  model: string;
  status: MachineStatus;
  speedMpm: number;         // metres / minute
  fabricType: string;
  installedOn: string;
  lastServiceOn: string;
  operator: string;
  healthScore: number;      // 0-100
  totalMetersToday: number;
  defectRate: number;       // defects per 100 m
}

export type DeviceKind =
  | "Edge AI Compute"
  | "Line-Scan Camera"
  | "Area-Scan Camera"
  | "LED Ring Light"
  | "Rotary Encoder"
  | "Signal Tower / Andon"
  | "Environment Sensor"
  | "PLC Relay Module"
  | "Network Gateway";

export type DeviceStatus = "Online" | "Offline" | "Degraded" | "Provisioning";

export interface IotDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  hardware: string;
  machineId: string;
  ip: string;
  firmware: string;
  status: DeviceStatus;
  uptimePct: number;
  tempC: number;
  cpuPct: number;
  latencyMs: number;
  lastSeen: string;
  protocol: "MQTT" | "Modbus TCP" | "GigE Vision" | "OPC-UA" | "HTTP";
  notes: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  floor: string;
  supervisor: string;
}

export type ReportStatus = "Draft" | "Generated" | "Approved" | "Sent to Buyer";

export interface QcReport {
  id: string;
  title: string;
  buyer: string;
  lineId: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
  status: ReportStatus;
  aqlLevel: "2.5" | "4.0" | "1.5";
  inspectedMeters: number;
  defectCount: number;
  pointsPer100m: number;
  verdict: "Pass" | "Fail" | "Conditional";
  wasteMeters: number;
  costImpactUsd: number;
  summary: string;
  author: string;
}

export interface AlertItem {
  id: string;
  at: string;
  level: "Critical" | "Warning" | "Info";
  title: string;
  message: string;
  machineId: string;
  acknowledged: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface AppState {
  users: User[];
  lines: ProductionLine[];
  machines: Machine[];
  devices: IotDevice[];
  defects: Defect[];
  reports: QcReport[];
  alerts: AlertItem[];
  chat: ChatMessage[];
}
