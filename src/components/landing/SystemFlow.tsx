"use client";

import { motion } from "motion/react";

/**
 * Animated architecture diagram - the single "how the whole thing operates"
 * picture. Signal travels left to right: fabric -> camera -> edge inference ->
 * three outputs. Packets ride the same path data the wires are drawn from, so
 * a dot always follows a visible wire.
 */

const WIRE = {
  machineCam: "M192 214 C 232 214, 234 196, 268 196",
  camEdge: "M436 196 C 478 196, 480 230, 520 230",
  encEdge: "M192 334 C 340 334, 402 270, 520 262",
  envEdge: "M192 408 C 360 408, 404 292, 520 288",
  edgeAndon: "M720 220 C 772 220, 764 102, 812 102",
  edgeDash: "M720 250 C 766 250, 770 240, 812 240",
  edgeCloud: "M720 280 C 772 280, 764 378, 812 378",
} as const;

const TEAL = "#19c6ad";
const AMBER = "#f3ae43";
const VIOLET = "#8d78eb";

function Node({
  x,
  y,
  w,
  h,
  title,
  sub,
  accent = false,
  tone = TEAL,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  accent?: boolean;
  tone?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={accent ? "rgba(25,198,173,0.10)" : "#0e2033"}
        stroke={accent ? tone : "rgba(255,255,255,0.14)"}
        strokeWidth={accent ? 1.6 : 1}
      />
      <text
        x={x + w / 2}
        y={y + (accent ? 38 : 26)}
        textAnchor="middle"
        fill="#e7eff4"
        fontSize={accent ? 17 : 14}
        fontWeight={700}
      >
        {title}
      </text>
      {sub.split("\n").map((line, i) => (
        <text
          key={line}
          x={x + w / 2}
          y={y + (accent ? 62 : 46) + i * 16}
          textAnchor="middle"
          fill="#a9bcc8"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Wire({
  d,
  tone = TEAL,
  dur = 2.4,
  delay = 0,
}: {
  d: string;
  tone?: string;
  dur?: number;
  delay?: number;
}) {
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1.4} />
      <path
        d={d}
        fill="none"
        stroke={tone}
        strokeWidth={1.4}
        strokeOpacity={0.4}
        strokeDasharray="5 9"
      />
      <circle r={9} fill={tone} opacity={0.16}>
        <animateMotion path={d} dur={dur + "s"} begin={delay + "s"} repeatCount="indefinite" />
      </circle>
      <circle r={4.5} fill={tone}>
        <animateMotion path={d} dur={dur + "s"} begin={delay + "s"} repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function WireLabel({
  x,
  y,
  text,
  tone = "#7f95a7",
}: {
  x: number;
  y: number;
  text: string;
  tone?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={tone}
      fontSize={11}
      fontFamily="ui-monospace, monospace"
    >
      {text}
    </text>
  );
}

export function SystemFlow() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e2033]/70 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 1000 470"
          className="w-full min-w-[820px]"
          role="img"
          aria-label="Signal path: the knitting machine, encoder and environment sensor feed a line-scan camera and an edge AI box, which drives the andon tower, the floor dashboard and the buyer report sync."
        >
          {([
            ["SENSE", 108],
            ["SEE", 352],
            ["DECIDE", 620],
            ["ACT", 900],
          ] as const).map(([label, cx]) => (
            <text
              key={label}
              x={cx}
              y={30}
              textAnchor="middle"
              fill={TEAL}
              fontSize={11}
              fontWeight={700}
              letterSpacing={2.4}
              fontFamily="ui-monospace, monospace"
            >
              {label}
            </text>
          ))}

          {/* on-premise boundary */}
          <rect
            x={12}
            y={44}
            width={776}
            height={412}
            rx={18}
            fill="none"
            stroke="rgba(25,198,173,0.22)"
            strokeWidth={1}
            strokeDasharray="6 7"
          />
          <text
            x={26}
            y={64}
            fill={TEAL}
            fontSize={11}
            fontFamily="ui-monospace, monospace"
            opacity={0.85}
          >
            INSIDE THE FACTORY — works with the internet down
          </text>

          {/* wires drawn under the nodes */}
          <Wire d={WIRE.machineCam} dur={2.0} />
          <Wire d={WIRE.camEdge} dur={1.6} delay={0.3} />
          <Wire d={WIRE.encEdge} dur={2.8} delay={0.5} />
          <Wire d={WIRE.envEdge} dur={3.1} delay={0.9} />
          <Wire d={WIRE.edgeAndon} tone={AMBER} dur={1.4} delay={0.2} />
          <Wire d={WIRE.edgeDash} dur={1.8} delay={0.4} />
          <Wire d={WIRE.edgeCloud} tone={VIOLET} dur={3.4} delay={0.7} />

          <WireLabel x={232} y={184} text="fabric 42 m/min" />
          <WireLabel x={486} y={184} text="2048 px @ 48 kHz" />
          <WireLabel x={330} y={316} text="exact metre position" />
          <WireLabel x={330} y={390} text="heat · humidity · lint" />
          <WireLabel x={772} y={146} text="relay" tone={AMBER} />
          <WireLabel x={768} y={226} text="LAN" tone={TEAL} />
          <WireLabel x={778} y={332} text="~40 KB / shift" tone={VIOLET} />

          <Node
            x={24}
            y={176}
            w={168}
            h={92}
            title="Knitting machine"
            sub={"the factory already\nowns it — unchanged"}
          />
          <Node x={24} y={306} w={168} h={56} title="Rotary encoder" sub="1000 pulses / rev" />
          <Node x={24} y={380} w={168} h={56} title="Env sensor node" sub="ESP32 · SHT41 · PMS5003" />
          <Node
            x={268}
            y={150}
            w={168}
            h={92}
            title="Camera + LED bar"
            sub={"line-scan sensor,\nstrobed diffuse light"}
          />

          <Node
            x={520}
            y={186}
            w={200}
            h={128}
            title="Edge AI box"
            sub={"YOLOv10-nano\n38 ms per frame\nJetson Orin Nano"}
            accent
          />

          <Node
            x={812}
            y={60}
            w={176}
            h={84}
            title="Andon tower"
            sub={"red light + buzzer,\nmachine auto-stop"}
            tone={AMBER}
          />
          <Node
            x={812}
            y={198}
            w={176}
            h={84}
            title="Floor dashboard"
            sub={"defect log, cost,\nroot cause"}
          />
          <Node
            x={812}
            y={336}
            w={176}
            h={84}
            title="Buyer report"
            sub={"metadata only,\nsynced over 4G"}
            tone={VIOLET}
          />

          <text x={620} y={348} textAnchor="middle" fill="#7f95a7" fontSize={11.5}>
            Frames are processed and thrown away —
          </text>
          <text x={620} y={366} textAnchor="middle" fill="#7f95a7" fontSize={11.5}>
            no video ever leaves the building.
          </text>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-5 grid gap-3 sm:grid-cols-3"
      >
        {([
          ["Sense + See", "Camera, encoder and environment node describe the fabric and its context.", TEAL],
          ["Decide", "The edge box names the defect, places it on the roll and prices it — locally.", TEAL],
          ["Act", "The operator is alerted in under a second; the buyer gets a report at shift close.", AMBER],
        ] as const).map(([t, b, c]) => (
          <div key={t} className="rounded-xl border border-white/8 bg-[#0b1a29] p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: c }}>
              {t}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-400">{b}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
