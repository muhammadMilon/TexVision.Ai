"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Camera,
  Cpu,
  Eye,
  FileText,
  Gauge,
  Lightbulb,
  Network,
  Radio,
  Router,
  ScanLine,
  Search,
  Siren,
  Thermometer,
  Wallet,
  Wrench,
} from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { SystemFlow } from "@/components/landing/SystemFlow";
import { DefectRace } from "@/components/landing/DefectRace";
import { DefectGallery } from "@/components/landing/DefectGallery";
import { ModelProof } from "@/components/landing/ModelProof";
import { ImpactCharts } from "@/components/landing/ImpactCharts";
import { FabricScanner } from "@/components/FabricScanner";

/* ------------------------------------------------------------- primitives */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "dark",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  tone?: "dark" | "darker";
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 ${
        tone === "darker" ? "bg-[#071019]" : "bg-[#0a1623]"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mb-12 max-w-3xl"
        >
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-teal">
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[44px]">
            {title}
          </h2>
          {lead ? (
            <p className="mt-5 text-[15px] leading-relaxed text-slate-400 sm:text-base">{lead}</p>
          ) : null}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------- data */

const PIPELINE = [
  {
    icon: Eye,
    step: "01",
    title: "Detect",
    body: "A camera over the fabric web streams to an edge box. A YOLOv10-nano detector flags holes, yarn breaks, stains, colour shifts and knit irregularities in 38 ms — faster than the fabric moves.",
    out: "Defect class + box + confidence",
  },
  {
    icon: Search,
    step: "02",
    title: "Analyse",
    body: "Each detection is stamped with the exact metre position from the roll encoder, plus machine, shift and operator, and scored for severity against the four-point standard.",
    out: "Severity + roll position",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Predict the cause",
    body: "Recurring patterns are clustered per machine. Twelve holes on one cam track is not bad luck — it is a broken needle, and the system names it.",
    out: "Ranked root cause + fix",
  },
  {
    icon: Wallet,
    step: "04",
    title: "Cost it",
    body: "Defect geometry converts to metres of unusable fabric, then to money at your fabric rate. Waste stops being a vague percentage and becomes a number per machine per shift.",
    out: "Metres lost + USD impact",
  },
  {
    icon: FileText,
    step: "05",
    title: "Report",
    body: "At shift close the log becomes a buyer-ready AQL report with a Pass / Conditional / Fail verdict — the digital audit trail global buyers increasingly demand.",
    out: "Buyer-ready QC report",
  },
];

const PROBLEMS = [
  {
    n: "01",
    title: "Human eyes fatigue in 20–30 minutes",
    body: "Continuous visual scanning of moving fabric is one of the hardest attention tasks on a factory floor. Miss-rates climb as the shift goes on, and nobody is at fault.",
  },
  {
    n: "02",
    title: "Feedback arrives a whole roll too late",
    body: "A defect found at the inspection table was created hundreds of metres earlier. By the time anyone knows, the machine has already produced the same fault over and over.",
  },
  {
    n: "03",
    title: "Buyers now audit the data, not just the cloth",
    body: "AQL failures cost shipment penalties and relationships. Buyers increasingly want traceable, digital quality records — which a paper inspection sheet cannot provide.",
  },
];

const HARDWARE = [
  {
    icon: Cpu,
    name: "Edge AI compute",
    part: "NVIDIA Jetson Orin Nano 8GB — or Raspberry Pi 5 + Hailo-8L for the low-cost tier",
    why: "Runs the detector on the machine itself. No internet round-trip, so detection survives the factory's patchy connectivity.",
    price: "$180 – $249",
  },
  {
    icon: Camera,
    name: "Inspection camera",
    part: "Basler racer raL2048-48gm line-scan (or Hikrobot MV-CS060 area-scan)",
    why: "2048 px across a 1400 mm fabric width at 48 kHz line rate — enough resolution to see a single dropped stitch.",
    price: "$140 – $320",
  },
  {
    icon: Lightbulb,
    name: "LED bar light",
    part: "Effilux EFFI-LINE 1200 mm diffuse white bar",
    why: "Consistent, strobed lighting is what makes defect contrast repeatable. Without it the model sees shadows, not defects.",
    price: "$60 – $110",
  },
  {
    icon: Gauge,
    name: "Rotary encoder",
    part: "Omron E6B2-CWZ6C, 1000 pulses/rev on the take-down roller",
    why: "Gives every defect an exact metre position on the roll, so the QC team can find it physically later.",
    price: "$25 – $45",
  },
  {
    icon: Siren,
    name: "Andon signal tower",
    part: "Patlite LR6 3-stack tower + buzzer, driven over a relay",
    why: "The operator alert. On a Critical detection it goes red — and the same relay can trigger machine auto-stop.",
    price: "$35 – $70",
  },
  {
    icon: Thermometer,
    name: "Environment sensor node",
    part: "ESP32-S3 + SHT41 (temp/humidity) + PMS5003 (lint dust)",
    why: "Cheap context. Defect spikes correlate with heat and lint density — this node is what makes that correlation visible.",
    price: "$18 – $30",
  },
  {
    icon: Radio,
    name: "PLC / relay interface",
    part: "Siemens S7-1200 or a simple 4-channel opto-isolated relay board",
    why: "Reads machine speed off the drive and carries the auto-stop interlock back to the machine.",
    price: "$40 – $260",
  },
  {
    icon: Router,
    name: "Floor gateway",
    part: "Teltonika RUT956 industrial router with 4G failover",
    why: "Syncs defect metadata only — a few KB per shift. Video never leaves the factory network.",
    price: "$160 (one per floor)",
  },
];

const FEASIBLE = [
  {
    icon: BadgeCheck,
    title: "The model already works",
    body: "A YOLOv10-nano fine-tuned on MVTec AD + TILDA plus our own annotations reaches 96.4% detection accuracy, 94.2% precision and 91.7% recall in lab validation, at 38 ms per frame.",
    proof: "Prototype validated",
  },
  {
    icon: Cpu,
    title: "The hardware is commodity",
    body: "Every part in the bill of materials is orderable today from standard industrial suppliers. Nothing is custom silicon, and nothing needs to be invented.",
    proof: "~$520 per inspection point",
  },
  {
    icon: Wrench,
    title: "It retrofits — no new machines",
    body: "The rig mounts onto the existing frame of a circular knitting or stenter machine. Factories keep their capital equipment; we add a sensing and inference layer.",
    proof: "Zero replacement capex",
  },
  {
    icon: Network,
    title: "It works offline by design",
    body: "Inference happens on-device. A dropped internet link degrades reporting sync, never detection — which is the difference between a demo and a product in a Bangladeshi factory.",
    proof: "No cloud dependency",
  },
];

const COMPARE = [
  { label: "Cost per inspection line", manual: "Wages, ongoing", imported: "$40,000 – $100,000+", tex: "~$520 hardware + $32/mo" },
  { label: "Detection latency", manual: "Minutes to a full roll", imported: "Real time", tex: "38 ms, real time" },
  { label: "Consistency across a shift", manual: "Falls after 20–30 min", imported: "Consistent", tex: "Consistent" },
  { label: "Digital audit trail", manual: "Paper sheets", imported: "Vendor format", tex: "Buyer-ready AQL export" },
  { label: "Works without internet", manual: "Yes", imported: "Often cloud-tied", tex: "Yes — edge-first" },
  { label: "Local support & language", manual: "—", imported: "Overseas contracts", tex: "On-ground, in Bangladesh" },
];

const ROADMAP = [
  {
    when: "Months 1–3",
    title: "Proof of concept",
    body: "Train the detector on public fabric-defect datasets and validate a first prototype in a controlled setting.",
    items: ["Initial model", "Jetson prototype", "Lab accuracy validation"],
    done: true,
  },
  {
    when: "Months 4–8",
    title: "Pilot deployment",
    body: "Install with 2–3 partner factories, collect live floor data and harden the physical enclosure.",
    items: ["Factory-floor data", "Dust, heat & vibration testing", "Model fine-tuning"],
    done: false,
  },
  {
    when: "Months 9–14",
    title: "Commercial launch",
    body: "Formalise hardware-as-a-service pricing, onboard first customers and ship the compliance dashboard.",
    items: ["First 10–15 paying factories", "Local support partner", "Buyer-report module"],
    done: false,
  },
  {
    when: "Year 2+",
    title: "Scale and expand",
    body: "Grow past 50 factories, add woven and denim models, and connect with ERP/MES systems.",
    items: ["50+ factories", "New fabric classes", "Production-system integration"],
    done: false,
  },
];

/* -------------------------------------------------------------------- page */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a1623]">
      <Nav />

      {/* ============================================================ HERO */}
      <section className="grid-bg relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_500px_at_80%_-5%,rgba(25,198,173,0.16),transparent_62%),radial-gradient(700px_460px_at_5%_95%,rgba(141,120,235,0.12),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal/28 bg-teal/8 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-teal"
            >
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-teal" />
              National AI Business Summit — SUST submission
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 font-display text-[42px] font-bold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[68px]"
            >
              A quality inspector
              <br />
              that never{" "}
              <span className="relative text-teal">
                loses focus
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M0 6 Q 50 1 100 5 T 200 3" stroke="#19c6ad" strokeWidth="2" fill="none" opacity="0.55" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-7 max-w-xl text-[16px] leading-relaxed text-slate-400 sm:text-lg"
            >
              TexVision AI is a small camera-and-edge-computer kit that bolts onto the knitting
              machines a Bangladeshi factory already owns. It watches the fabric as it is being
              made, catches the defect in <b className="text-white">38 milliseconds</b>, tells the
              floor <b className="text-white">which machine part caused it</b>, and prices the waste
              in taka before the roll is finished.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3.5 text-[15px] font-bold text-[#04231f] shadow-[0_16px_40px_-14px_rgba(25,198,173,0.9)] transition hover:bg-[#2adcc2]"
              >
                Open the live dashboard
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-slate-200 transition hover:border-teal/60 hover:text-white"
              >
                How it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4"
            >
              {[
                ["38 ms", "inference"],
                ["96.4%", "lab accuracy"],
                ["~$520", "per machine"],
                ["0", "cloud calls"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-bold tracking-tight text-teal">{v}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <FabricScanner running sensitivity={70} />
            <p className="mt-3 text-center text-[11px] uppercase tracking-wider text-slate-500">
              Simulated inspection feed — this is what the operator sees
            </p>
          </motion.div>
        </div>
      </section>

      {/* ==================================================== ONE-LINE PITCH */}
      <div className="border-y border-white/8 bg-[#071019] py-5">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 gap-10 whitespace-nowrap pr-10 font-mono text-[12px] uppercase tracking-[0.14em] text-slate-500">
            {[...Array(2)].map((_, dup) => (
              <span key={dup} className="flex gap-10">
                {[
                  "Detect the defect",
                  "Locate it on the roll",
                  "Name the machine fault",
                  "Price the waste",
                  "Print the buyer report",
                  "Retrofit — no new machines",
                  "Runs offline on the floor",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-3">
                    <span className="h-1 w-1 rounded-full bg-teal" />
                    {t}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= PROBLEM */}
      <Section
        id="problem"
        eyebrow="The problem"
        title="Bangladesh exports $47B of clothing a year, and quality is still checked by eye."
        lead="Roughly 4–7% of fabric is lost to defects that were either missed or found too late. On a national scale that is a very large amount of money walking out of the country's biggest industry — and none of it is anybody's fault. It is a limit of human attention."
        tone="darker"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="border-t border-white/8">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <div className="grid grid-cols-[44px_1fr] gap-4 border-b border-white/8 py-6">
                  <span className="pt-1 font-mono text-xs text-teal">{p.n}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-white/10 bg-[#0e2033]/80 p-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                Where a roll of fabric goes
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Shipped as good fabric", pct: 93, color: "#00ab95" },
                  { label: "Downgraded to B-grade", pct: 4.2, color: "#c38302" },
                  { label: "Scrapped outright", pct: 2.8, color: "#d04d5b" },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="text-slate-300">{r.label}</span>
                      <span className="font-mono font-semibold text-white">{r.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/6">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: r.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${r.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#e05c68]/25 bg-[#e05c68]/8 p-4">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#e05c68]" />
                <p className="text-xs leading-relaxed text-slate-300">
                  That 7% of downgraded and scrapped fabric is the target. Halving it is worth more
                  to a mid-sized factory than any labour saving on the floor.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* the same fault, with and without the system — animated */}
        <Reveal delay={0.1}>
          <div className="mt-14">
            <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              This is what &ldquo;found too late&rdquo; actually costs.
            </h3>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-400">
              The animation below runs the same broken needle on two machines. Nothing is sped up
              for effect — the roll simply keeps moving while nobody knows.
            </p>
            <div className="mt-6">
              <DefectRace />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ============================================================= HOW */}
      <Section
        id="how"
        eyebrow="How it works"
        title="Five steps, and every one of them runs on the machine itself."
        lead="This is the whole product. A camera sees the fabric, a small computer decides what is wrong with it, and four things follow automatically — location, cause, cost and paperwork."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {PIPELINE.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.07}>
              <div className="group relative h-full rounded-2xl border border-white/10 bg-[#0e2033]/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-teal/40">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/12 text-teal transition group-hover:bg-teal/20">
                    <s.icon size={20} />
                  </span>
                  <span className="font-mono text-[11px] text-slate-600">{s.step}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{s.body}</p>
                <p className="mt-4 border-t border-white/8 pt-3 font-mono text-[10px] uppercase tracking-wider text-teal">
                  → {s.out}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* the whole system on one page — where every signal goes */}
        <Reveal delay={0.15}>
          <div className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white">
                  The same five steps, drawn as wiring
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Follow a single frame from the fabric to the operator&rsquo;s alarm. Everything
                  inside the dashed box happens on the factory floor, with no internet.
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1a29] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-teal" />
                live signal path
              </span>
            </div>
            <SystemFlow />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-teal/22 bg-teal/6 p-6">
            <ScanLine size={22} className="shrink-0 text-teal" />
            <p className="text-sm leading-relaxed text-slate-300">
              <b className="text-white">The key design decision:</b> steps 1 and 2 never touch the
              internet. Video is processed on the edge box bolted to the machine and is then thrown
              away — only a few kilobytes of defect metadata per shift are synced. That is what makes
              this workable on a real Bangladeshi factory floor rather than only in a demo.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ========================================================= DEFECTS */}
      <Section
        id="defects"
        eyebrow="What the camera sees"
        title="Six defects, and what each one is telling you about the machine."
        lead="A detection on its own is only half the value. Every class below maps to a specific mechanical fault, which is how a quality alert becomes a maintenance instruction the floor can act on."
        tone="darker"
      >
        <DefectGallery />
      </Section>

      {/* =========================================================== PROOF */}
      <Section
        id="proof"
        eyebrow="Does it actually work"
        title="The numbers behind the claim, and where the 38 milliseconds go."
        lead="Two questions decide whether this is a product or a slide: is the model accurate enough to trust on a live machine, and is it fast enough to stop that machine before the fault repeats. Both are measured, not estimated."
      >
        <ModelProof />
      </Section>

      {/* ======================================================== HARDWARE */}
      <Section
        id="hardware"
        eyebrow="IoT hardware"
        title="Exactly which devices are needed, and what each one costs."
        lead="No custom silicon, no proprietary parts. Everything below is off-the-shelf and orderable today. One inspection point is roughly $520 in hardware — the same job an imported inspection line charges $40,000–$100,000 for."
        tone="darker"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HARDWARE.map((h, i) => (
            <Reveal key={h.name} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0e2033]/70 p-5 transition hover:border-teal/35">
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-white/5 text-teal">
                  <h.icon size={18} />
                </span>
                <h3 className="font-display text-[15px] font-semibold text-white">{h.name}</h3>
                <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-teal/80">{h.part}</p>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate-400">{h.why}</p>
                <p className="mt-4 border-t border-white/8 pt-3 font-mono text-xs font-medium text-white">
                  {h.price}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["~$520", "Total hardware per inspection point", "Edge box, camera, light, encoder, andon tower, mounting"],
              ["1 per floor", "Shared infrastructure", "Gateway router and PLC bridge are shared across machines"],
              ["2–4 hours", "Install time per machine", "Bracket mount, power, one network cable, calibration"],
            ].map(([v, l, s]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-[#0e2033]/70 p-5">
                <p className="font-display text-2xl font-bold tracking-tight text-teal">{v}</p>
                <p className="mt-1.5 text-sm font-semibold text-white">{l}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{s}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ======================================================== FEASIBLE */}
      <Section
        id="feasible"
        eyebrow="Why this is feasible"
        title="Nothing here needs to be invented. It needs to be installed."
        lead="Every hard part of this problem — object detection, cheap edge inference, industrial cameras — was solved by somebody else and is available off the shelf. What is missing is a system priced and supported for a Bangladeshi factory. That is the gap TexVision fills."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FEASIBLE.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div className="flex h-full gap-5 rounded-2xl border border-white/10 bg-[#0e2033]/70 p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal/12 text-teal">
                  <f.icon size={20} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{f.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                    <BadgeCheck size={11} /> {f.proof}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* comparison table */}
        <Reveal delay={0.16}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="bg-[#0e2033]">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      &nbsp;
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Manual inspection
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Imported system
                    </th>
                    <th className="border-l border-teal/25 bg-teal/8 px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-teal">
                      TexVision AI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((r) => (
                    <tr key={r.label} className="border-t border-white/8 bg-[#0b1a29]">
                      <td className="px-5 py-4 font-medium text-slate-200">{r.label}</td>
                      <td className="px-5 py-4 text-slate-400">{r.manual}</td>
                      <td className="px-5 py-4 text-slate-400">{r.imported}</td>
                      <td className="border-l border-teal/25 bg-teal/6 px-5 py-4 font-semibold text-white">
                        {r.tex}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ========================================================== IMPACT */}
      <Section
        id="impact"
        eyebrow="The impact, charted"
        title="What one 10-machine floor gets back in the first year."
        lead="This is the reference factory the calculator below starts from: ten knitting machines, 1,800 metres each per day, fabric at $3.10 a metre, 5.4% currently lost to defects. Halve that loss and the arithmetic looks like this."
      >
        <ImpactCharts />
      </Section>

      {/* ============================================================= ROI */}
      <Section
        id="roi"
        eyebrow="Run the numbers yourself"
        title="Does it actually pay for itself? Move the sliders."
        lead="This is the question every factory owner asks first, so the model is open. Set your own machine count, fabric price and waste rate — the payback period recalculates live."
        tone="darker"
      >
        <RoiCalculator />
      </Section>

      {/* ========================================================= ROADMAP */}
      <Section
        id="roadmap"
        eyebrow="Roadmap"
        title="A 14-month path from validated prototype to paying factories."
        lead="The first phase is already complete. What follows is deliberately unglamorous: get onto real machines, collect real dust-and-heat data, and prove the waste number in someone else's factory."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.when} delay={i * 0.08}>
              <div
                className={`h-full rounded-2xl border p-6 ${
                  r.done ? "border-teal/35 bg-teal/6" : "border-white/10 bg-[#0e2033]/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-teal">
                    {r.when}
                  </span>
                  {r.done ? <BadgeCheck size={16} className="text-teal" /> : null}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{r.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{r.body}</p>
                <ul className="mt-4 space-y-2">
                  {r.items.map((it) => (
                    <li
                      key={it}
                      className="border-t border-white/8 pt-2 text-[12px] text-slate-300"
                    >
                      <span className="mr-1.5 text-amber">+</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ============================================================= CTA */}
      <section className="grid-bg relative overflow-hidden border-t border-white/8 bg-[#071019] px-5 py-24 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_400px_at_50%_0%,rgba(25,198,173,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal">
              See the whole workflow
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              The dashboard is live and fully explorable.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">
              Sign in with any of the four demo roles and walk the entire loop — live detection,
              defect records, IoT device health, root-cause analysis, waste costing and a generated
              buyer report.
            </p>
            <Link
              href="/login"
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-4 text-[15px] font-bold text-[#04231f] shadow-[0_16px_44px_-14px_rgba(25,198,173,0.9)] transition hover:bg-[#2adcc2]"
            >
              Open the dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-4 font-mono text-[11px] text-slate-500">
              Demo credentials are listed on the sign-in page
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================================================== FOOTER */}
      <footer className="border-t border-white/8 bg-[#0a1623] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-teal/30 bg-teal/10">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />
            </span>
            <span className="font-display text-sm font-bold text-white">
              TexVision<span className="text-teal">.AI</span>
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            SUST AI Lab · National AI Business Summit · 2026
          </p>
          <p className="text-[11px] text-slate-600">
            Frontend demonstration build — all data is simulated.
          </p>
        </div>
      </footer>
    </main>
  );
}
