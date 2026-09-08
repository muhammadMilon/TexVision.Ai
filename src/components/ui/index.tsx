"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Card */

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0e2033]/80 backdrop-blur-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h3 className="font-display text-[15px] font-semibold tracking-tight text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "subtle";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-teal text-[#04231f] hover:bg-[#2adcc2] shadow-[0_10px_30px_-12px_rgba(25,198,173,0.9)]",
    ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
    outline: "border border-white/15 text-slate-200 hover:border-teal/60 hover:text-white",
    danger: "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
    subtle: "bg-white/5 text-slate-200 hover:bg-white/10",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-[15px]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Badge */

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: "teal" | "amber" | "danger" | "violet" | "slate" | "blue";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    teal: "bg-teal/12 text-teal border-teal/30",
    amber: "bg-amber/12 text-amber border-amber/30",
    danger: "bg-danger/12 text-danger border-danger/30",
    violet: "bg-violet/12 text-violet border-violet/30",
    blue: "bg-sky-400/12 text-sky-300 border-sky-400/30",
    slate: "bg-white/5 text-slate-300 border-white/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function severityTone(s: string) {
  return s === "Critical" ? "danger" : s === "Major" ? "amber" : "teal";
}

export function statusTone(s: string) {
  switch (s) {
    case "Running":
    case "Online":
    case "Resolved":
    case "Approved":
    case "Pass":
      return "teal";
    case "Idle":
    case "Provisioning":
    case "Under Review":
    case "Draft":
    case "Conditional":
      return "amber";
    case "Maintenance":
    case "Degraded":
      return "violet";
    case "Stopped":
    case "Offline":
    case "Open":
    case "Fail":
      return "danger";
    default:
      return "slate";
  }
}

/* ----------------------------------------------------------------- Input */

const fieldBase =
  "w-full rounded-lg border border-white/10 bg-[#0a1a2a] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-teal/60 focus:ring-2 focus:ring-teal/20";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, "min-h-24 resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(fieldBase, "appearance-none pr-8", props.className)}>
      {props.children}
    </select>
  );
}

/* ----------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              "my-8 w-full rounded-2xl border border-white/12 bg-[#0d1f31] shadow-2xl",
              wide ? "max-w-3xl" : "max-w-xl",
            )}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/8 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex justify-end gap-3 border-t border-white/8 px-6 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------- EmptyRow */

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-500">
        ∅
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

/* --------------------------------------------------------------- Toolbar */

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-teal">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
