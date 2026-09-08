"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SEVERITY_COLOR } from "@/lib/utils";
import { simulateDetection, type LiveDetection } from "@/lib/ai";

/**
 * Simulated inspection viewport.
 *
 * A CSS-drawn fabric web scrolls past a scan line; every tick the dummy
 * detector may emit a box, which is drawn with its class label and
 * confidence, then fades out. Nothing here touches a real model - it renders
 * the same shape of output the edge node would stream.
 */
export function FabricScanner({
  running = true,
  sensitivity = 55,
  speedMpm = 42,
  cameraLabel = "CAM 04",
  compact = false,
  onDetect,
}: {
  running?: boolean;
  sensitivity?: number;
  speedMpm?: number;
  cameraLabel?: string;
  compact?: boolean;
  onDetect?: (d: LiveDetection) => void;
}) {
  const [boxes, setBoxes] = useState<LiveDetection[]>([]);
  const [meters, setMeters] = useState(0);
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(38);
  const onDetectRef = useRef(onDetect);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => {
      const d = simulateDetection(sensitivity);
      if (d) {
        setBoxes((prev) => [...prev.slice(-4), d]);
        onDetectRef.current?.(d);
      }
      setMeters((m) => +(m + speedMpm / 60).toFixed(1));
      setFps(58 + Math.round(Math.random() * 4));
      setLatency(34 + Math.round(Math.random() * 12));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [running, sensitivity, speedMpm]);

  // retire boxes after 3.4 s
  useEffect(() => {
    if (!boxes.length) return;
    const t = window.setTimeout(() => {
      const cutoff = Date.now() - 3400;
      setBoxes((prev) => prev.filter((b) => b.at > cutoff));
    }, 600);
    return () => window.clearTimeout(t);
  }, [boxes]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#08121d] p-3 shadow-2xl">
      {/* HUD top */}
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${running ? "animate-soft-pulse bg-[#d04d5b]" : "bg-slate-600"}`}
          />
          {running ? "REC" : "PAUSED"} · {cameraLabel} / live feed
        </span>
        <span>2048 × 512 · {fps} fps</span>
      </div>

      {/* viewport */}
      <div
        className={`fabric-weave relative mt-2.5 overflow-hidden rounded-xl ${
          compact ? "h-52" : "h-72 sm:h-80"
        } ${running ? "animate-roll" : ""}`}
      >
        {/* scan sweep */}
        {running ? (
          <div className="animate-sweep pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_30%,rgba(110,241,221,0.14)_50%,transparent_70%)]" />
        ) : null}

        {/* scan line */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-teal/40 shadow-[0_0_14px_rgba(25,198,173,0.7)]" />

        {/* detections */}
        <AnimatePresence>
          {boxes.map((b) => {
            const color = SEVERITY_COLOR[b.severity];
            return (
              <motion.div
                key={b.id}
                className="absolute"
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.22 }}
              >
                <div
                  className="h-full w-full rounded-[3px] border-2"
                  style={{ borderColor: color, boxShadow: `0 0 18px ${color}77` }}
                />
                <span
                  className="absolute -top-[22px] left-0 whitespace-nowrap rounded-t-[3px] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#06131c]"
                  style={{ background: color }}
                >
                  {b.type} {(b.confidence * 100).toFixed(0)}%
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* corner brackets */}
        {(["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2",
           "left-2 bottom-2 border-b-2 border-l-2", "right-2 bottom-2 border-b-2 border-r-2"] as const).map(
          (pos) => (
            <span key={pos} className={`pointer-events-none absolute h-4 w-4 border-teal/50 ${pos}`} />
          ),
        )}
      </div>

      {/* HUD bottom */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        <span>
          MODEL <b className="text-teal">yolov10n-fabric-v3</b>
        </span>
        <span>
          INFERENCE <b className="text-teal">{latency} ms</b>
        </span>
        <span>
          ROLL <b className="text-teal">{meters.toFixed(1)} m</b>
        </span>
        <span>
          EDGE <b className="text-teal">{running ? "ONLINE" : "IDLE"}</b>
        </span>
      </div>
    </div>
  );
}
