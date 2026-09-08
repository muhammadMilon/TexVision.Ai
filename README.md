# TexVision AI — Fabric Inspection Console

Frontend-only demonstration build of TexVision AI: an edge-AI computer-vision system for
Bangladesh's RMG industry that detects fabric defects in real time, predicts the machine fault
behind them, costs the resulting waste, and produces buyer-ready QC reports.

**There is no backend.** Every feature runs in the browser against a seeded dummy dataset held in
`localStorage`, including full CRUD, authentication and the "AI" workflow. The intelligence is
simulated with deterministic rules; the *workflow* is complete and real.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Demo credentials

The sign-in page lists these and fills them in on click.

| Role     | Email                     | Password      | Access |
|----------|---------------------------|---------------|--------|
| Admin    | `admin@texvision.ai`      | `admin123`    | Everything, incl. users & data reset |
| Manager  | `manager@texvision.ai`    | `manager123`  | Quality data, devices, analytics, reports |
| Operator | `operator@texvision.ai`   | `operator123` | Live inspection, defect logging |
| Buyer    | `buyer@texvision.ai`      | `buyer123`    | Read-only compliance portal |

## What is in it

**Public site (`/`)** — the pitch, written and drawn so a non-technical reader can see the idea is
feasible. It leans on animated visuals rather than prose wherever a picture is clearer:

| Section | Visual |
|---|---|
| Hero | Live simulated inspection viewport (`FabricScanner`) |
| The problem | Fabric-fate bars, plus `DefectRace` — the same broken needle animated on two machines, one manual and one instrumented, with metres and money counting up live |
| How it works | The five-step pipeline, plus `SystemFlow` — an animated SVG of the whole signal path (machine → camera → edge box → andon / dashboard / buyer sync) with packets riding the wires and the on-premise boundary drawn in |
| What it sees | `DefectGallery` — the six defect classes drawn as CSS fabric swatches, each with a detection box that sweeps the row, its usual mechanical cause and its detection rate |
| Accuracy | `ModelProof` — animated accuracy/precision/recall/mAP gauges, the 38 ms inference budget as a stacked bar, and a "time to know" comparison on a labelled base-10 log axis |
| Hardware | The full IoT bill of materials with prices |
| Why feasible | Comparison against manual and imported inspection |
| Impact | `ImpactCharts` — monthly fabric written off with vs without, and defect share by root cause (Recharts) |
| ROI | Interactive payback calculator |
| Roadmap | The 14-month plan |

Every animation is deterministic and CSS/SVG-drawn — no GIFs, no video files, no external assets —
so nothing can fail to load and the visuals stay sharp at any zoom.

**Console (`/dashboard`)**

| Page | What it does |
|---|---|
| Overview | KPIs, 14-day severity trend, defect-class and per-machine charts, cumulative cost avoided, top root-cause findings, machine health, alerts |
| Live inspection | Simulated inference viewport with drawn detection boxes, sensitivity control, auto-log to the defect register, Andon signal tower with auto-stop |
| Defect records | Full CRUD, search + four filters, sortable paginated table, CSV export, cost recalculated on save |
| Machines | CRUD over inspection points, health scoring, one-click maintenance toggle |
| IoT devices | The device fleet with live telemetry jitter, CRUD, and the per-inspection-point bill of materials |
| Root-cause AI | Frequency clustering per machine + a rule table → ranked findings with a concrete fix, recoverable value, and a "raise work order" action |
| Waste & cost | Defect geometry → metres lost → money, with every assumption editable |
| AI assistant | Natural-language questions answered from the live dataset |
| QC reports | AI report generation (four-point ASTM D5430 scoring), CRUD, verdicts, text export |
| Users & access | Role management (admin only) |
| Settings | Detection thresholds, costing, model info, data reset |

## IoT hardware the system needs

Roughly **$520 per inspection point**, all off-the-shelf:

| Device | Part | Price |
|---|---|---|
| Edge AI compute | NVIDIA Jetson Orin Nano 8GB, or Raspberry Pi 5 + Hailo-8L | $180–249 |
| Inspection camera | Basler racer raL2048-48gm line-scan / Hikrobot area-scan | $140–320 |
| LED bar light | Effilux EFFI-LINE 1200 mm diffuse | $60–110 |
| Rotary encoder | Omron E6B2-CWZ6C, 1000 P/R | $25–45 |
| Andon signal tower | Patlite LR6 3-stack + buzzer, relay-driven | $35–70 |
| Environment sensor | ESP32-S3 + SHT41 + PMS5003 | $18–30 |
| PLC / relay interface | Siemens S7-1200 or opto-isolated relay board | $40–260 |
| Floor gateway | Teltonika RUT956 with 4G failover (one per floor) | $160 |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Motion · lucide-react.

State lives in a React context (`src/lib/store.tsx`) persisted to `localStorage` and seeded from
`src/lib/seed.ts`. The seed uses a fixed PRNG and a fixed anchor date so server and client renders
agree.

## Chart colours

The categorical palette in `src/lib/utils.ts` was validated against the dark chart surface
(`#0e2033`) for lightness band, chroma floor, colour-blind separation, normal-vision separation and
3:1 contrast. Re-run the validator if you change it.

---

`TexvisionAI.html` in the repo root is the original pitch deck this app was built from.
