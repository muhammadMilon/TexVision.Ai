import { ANCHOR } from "./seed";
import type { Defect, IotDevice, Machine } from "./types";

export const NOW = ANCHOR;

/** Fabric cost assumption used across the waste/cost model (USD per metre). */
export const FABRIC_COST_PER_M = 3.1;

export function inRangeDays(defects: Defect[], days: number) {
  const cutoff = NOW.getTime() - days * 86_400_000;
  return defects.filter((d) => new Date(d.detectedAt).getTime() >= cutoff);
}

export function kpis(defects: Defect[], machines: Machine[], devices: IotDevice[]) {
  const last24 = inRangeDays(defects, 1);
  const prev24 = defects.filter((d) => {
    const t = new Date(d.detectedAt).getTime();
    return t < NOW.getTime() - 86_400_000 && t >= NOW.getTime() - 2 * 86_400_000;
  });

  const metersToday = machines.reduce((s, m) => s + m.totalMetersToday, 0);
  const waste = last24.reduce((s, d) => s + d.fabricLossMeters, 0);
  const cost = last24.reduce((s, d) => s + d.costImpactUsd, 0);
  const critical = last24.filter((d) => d.severity === "Critical").length;
  const avgConfidence = last24.length
    ? last24.reduce((s, d) => s + d.confidence, 0) / last24.length
    : 0;
  const online = devices.filter((d) => d.status === "Online").length;
  const avgLatency = devices.filter((d) => d.latencyMs > 0);

  return {
    defects24: last24.length,
    defectsDelta: prev24.length ? ((last24.length - prev24.length) / prev24.length) * 100 : 0,
    metersToday,
    wasteMeters: waste,
    costUsd: cost,
    critical,
    avgConfidence,
    devicesOnline: online,
    devicesTotal: devices.length,
    avgLatency: avgLatency.length
      ? avgLatency.reduce((s, d) => s + d.latencyMs, 0) / avgLatency.length
      : 0,
    defectRate: metersToday ? (last24.length / metersToday) * 100 : 0,
    // What manual inspection would have missed, at an assumed 70% human catch rate.
    savedUsd: cost * 0.62,
  };
}

export function defectsByDay(defects: Defect[], days = 14) {
  const buckets: { day: string; label: string; total: number; critical: number; major: number; minor: number; waste: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(NOW.getTime() - i * 86_400_000);
    buckets.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      total: 0, critical: 0, major: 0, minor: 0, waste: 0,
    });
  }
  const index = new Map(buckets.map((b) => [b.day, b]));
  for (const def of defects) {
    const key = def.detectedAt.slice(0, 10);
    const b = index.get(key);
    if (!b) continue;
    b.total += 1;
    b.waste = +(b.waste + def.fabricLossMeters).toFixed(2);
    if (def.severity === "Critical") b.critical += 1;
    else if (def.severity === "Major") b.major += 1;
    else b.minor += 1;
  }
  return buckets;
}

export function defectsByType(defects: Defect[]) {
  const map = new Map<string, { type: string; count: number; waste: number; cost: number }>();
  for (const d of defects) {
    const e = map.get(d.type) ?? { type: d.type, count: 0, waste: 0, cost: 0 };
    e.count += 1;
    e.waste += d.fabricLossMeters;
    e.cost += d.costImpactUsd;
    map.set(d.type, e);
  }
  return [...map.values()]
    .map((e) => ({ ...e, waste: +e.waste.toFixed(1), cost: +e.cost.toFixed(0) }))
    .sort((a, b) => b.count - a.count);
}

export function defectsByMachine(defects: Defect[], machines: Machine[]) {
  return machines
    .map((m) => {
      const list = defects.filter((d) => d.machineId === m.id);
      return {
        machine: m.name.replace("Circular Knit ", "").replace("Denim Loom ", ""),
        id: m.id,
        count: list.length,
        waste: +list.reduce((s, d) => s + d.fabricLossMeters, 0).toFixed(1),
        cost: +list.reduce((s, d) => s + d.costImpactUsd, 0).toFixed(0),
        health: m.healthScore,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function defectsByShift(defects: Defect[]) {
  const shifts = ["A", "B", "C"] as const;
  return shifts.map((s) => {
    const list = defects.filter((d) => d.shift === s);
    return {
      shift: `Shift ${s}`,
      window: s === "A" ? "06:00-14:00" : s === "B" ? "14:00-22:00" : "22:00-06:00",
      count: list.length,
      critical: list.filter((d) => d.severity === "Critical").length,
      waste: +list.reduce((x, d) => x + d.fabricLossMeters, 0).toFixed(1),
    };
  });
}

export function hourlyProfile(defects: Defect[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}`.padStart(2, "0"), count: 0 }));
  for (const d of defects) hours[new Date(d.detectedAt).getUTCHours()].count += 1;
  return hours;
}

export function severitySplit(defects: Defect[]) {
  const order = ["Critical", "Major", "Minor"] as const;
  return order.map((sev) => ({
    name: sev,
    value: defects.filter((d) => d.severity === sev).length,
  }));
}

/** Radar input: how each machine scores across the model's watch dimensions. */
export function machineRadar(defects: Defect[], machines: Machine[]) {
  const dims = ["Hole", "Yarn Break", "Oil Stain", "Colour Shift", "Knitting Irregularity"];
  return dims.map((dim) => {
    const row: Record<string, string | number> = { dimension: dim.replace("Knitting ", "") };
    for (const m of machines.slice(0, 4)) {
      row[m.id] = defects.filter((d) => d.machineId === m.id && d.type === dim).length;
    }
    return row;
  });
}

/** Rolling projection of cumulative avoided cost (USD) if the system stays deployed. */
export function savingsProjection(defects: Defect[]) {
  const perDay = defectsByDay(defects, 14);
  let cumulative = 0;
  return perDay.map((b) => {
    const avoided = b.waste * FABRIC_COST_PER_M * 0.62;
    cumulative += avoided;
    return {
      label: b.label,
      avoided: +avoided.toFixed(1),
      cumulative: +cumulative.toFixed(1),
      manualBaseline: +(avoided * 2.6).toFixed(1),
    };
  });
}

export interface RootCauseFinding {
  machineId: string;
  machineName: string;
  cause: string;
  defectType: string;
  occurrences: number;
  share: number;
  confidence: number;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
  estimatedSavingUsd: number;
}

const RECOMMENDATIONS: Record<string, string> = {
  "Broken needle in cylinder":
    "Stop the machine at the next roll change and run a full needle-bed inspection. Replace the needles in the flagged cam track.",
  "Excessive yarn tension":
    "Re-balance creel tension to 4.5-5.5 cN and verify the positive feeder belt is not slipping.",
  "Damaged sinker": "Inspect and replace worn sinkers; check sinker cam timing.",
  "Low yarn strength / weak splice":
    "Escalate to the yarn store - request a CSP test on the current lot before it is issued again.",
  "Creel tension imbalance": "Recalibrate the tension discs across all feeders on this machine.",
  "Feeder eyelet wear": "Replace grooved ceramic eyelets on the affected feeders.",
  "Over-lubricated cylinder":
    "Reduce needle-oil dosing interval by one step and wipe the cylinder before the next run.",
  "Leaking needle-oil line": "Pressure-test the lubrication line and replace the leaking union.",
  "Manual handling contamination": "Reinforce glove policy at the take-down and re-brief the shift.",
  "Dye lot change mid-roll": "Enforce single-lot batching per roll in the planning sheet.",
  "Stenter temperature drift":
    "Recalibrate the chamber thermocouples; the drift pattern matches chamber 3.",
  "Uneven padder pressure": "Level the padder nip pressure across the working width.",
  "Cam setting drift": "Re-set cam heights to the standard stitch length and lock the adjusters.",
  "Worn needle latch": "Schedule a needle change - latch wear is beyond the service interval.",
  "Inconsistent stitch length": "Verify the QAP setting and the take-down roller tension.",
  "Yarn count variation": "Reject the incoming lot and request a count-CV report from the supplier.",
  "Contaminated bale in blend": "Trace the bale ID through the blend record and quarantine it.",
  "Spinning frame irregularity": "Share the defect signature with the spinning unit for frame audit.",
  "Fabric spreader misadjusted": "Re-centre the spreader and re-check selvedge alignment.",
  "Selvedge guide slip": "Tighten the guide clamp and re-run the alignment calibration.",
  "Uneven take-down tension": "Balance the take-down roller pressure left-to-right.",
};

/** The "AI" root-cause engine: frequency clustering + a rule table. */
export function rootCauseFindings(defects: Defect[], machines: Machine[]): RootCauseFinding[] {
  const groups = new Map<string, Defect[]>();
  for (const d of defects) {
    const key = `${d.machineId}|${d.rootCause}|${d.type}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }

  const perMachineTotal = new Map<string, number>();
  for (const d of defects) perMachineTotal.set(d.machineId, (perMachineTotal.get(d.machineId) ?? 0) + 1);

  const findings: RootCauseFinding[] = [];
  for (const [key, list] of groups) {
    if (list.length < 3) continue;
    const [machineId, cause, defectType] = key.split("|");
    const machine = machines.find((m) => m.id === machineId);
    const total = perMachineTotal.get(machineId) ?? 1;
    const share = list.length / total;
    const criticalShare = list.filter((d) => d.severity === "Critical").length / list.length;
    const waste = list.reduce((s, d) => s + d.fabricLossMeters, 0);

    findings.push({
      machineId,
      machineName: machine?.name ?? machineId,
      cause,
      defectType,
      occurrences: list.length,
      share,
      confidence: Math.min(0.98, 0.55 + share * 1.4 + criticalShare * 0.2),
      severity: share > 0.16 || criticalShare > 0.5 ? "High" : share > 0.09 ? "Medium" : "Low",
      recommendation: RECOMMENDATIONS[cause] ?? "Schedule a maintenance review for this component.",
      estimatedSavingUsd: +(waste * FABRIC_COST_PER_M * 0.62).toFixed(0),
    });
  }

  const rank = { High: 0, Medium: 1, Low: 2 };
  return findings
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.occurrences - a.occurrences)
    .slice(0, 8);
}

/** Waste and cost model shown on the Waste page. */
export function wasteModel(defects: Defect[], machines: Machine[]) {
  const monthly = inRangeDays(defects, 14);
  const wasteMeters = monthly.reduce((s, d) => s + d.fabricLossMeters, 0);
  const scaleToYear = 365 / 14;
  const detectedYearly = wasteMeters * scaleToYear;
  const producedYearly = machines.reduce((s, m) => s + m.totalMetersToday, 0) * 300;

  return {
    windowDays: 14,
    wasteMeters,
    wasteCost: wasteMeters * FABRIC_COST_PER_M,
    detectedYearly,
    detectedYearlyCost: detectedYearly * FABRIC_COST_PER_M,
    producedYearly,
    baselineWastePct: 5.4,
    targetWastePct: 2.8,
    avoidableYearlyCost: producedYearly * 0.026 * FABRIC_COST_PER_M,
  };
}
