"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { USERS } from "@/lib/seed";
import { FabricScanner } from "@/components/FabricScanner";

const ROLE_NOTE: Record<string, string> = {
  admin: "Full access — including user management and system settings",
  manager: "Quality data, analytics, reports and device management",
  operator: "Live inspection, defect logging and machine status",
  viewer: "Read-only buyer portal — reports and compliance only",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState("admin@texvision.ai");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    // Simulated round-trip so the state change is legible.
    window.setTimeout(() => {
      const res = login(email, password);
      if (res.ok) router.push("/dashboard");
      else {
        setError(res.error ?? "Sign-in failed.");
        setBusy(false);
      }
    }, 550);
  }

  function applyAccount(e: string, p: string) {
    setEmail(e);
    setPassword(p);
    setError("");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* ------------------------------------------------------ form side */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="absolute left-6 top-8 inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition hover:text-teal sm:left-12"
        >
          <ArrowLeft size={15} /> Back to site
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal/30 bg-teal/10">
              <span className="h-3 w-3 rounded-full bg-teal shadow-[0_0_14px_#19c6ad]" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              TexVision<span className="text-teal">.AI</span>
            </span>
          </div>

          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-white">
            Sign in to the console
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Factory quality intelligence — Shahjalal University of Science and Technology.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Email
              </span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#0a1a2a] py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-teal/60 focus:ring-2 focus:ring-teal/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Password
              </span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#0a1a2a] py-3 pl-10 pr-10 text-sm text-white outline-none transition focus:border-teal/60 focus:ring-2 focus:ring-teal/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-[#e05c68]/30 bg-[#e05c68]/10 px-3 py-2.5 text-[13px] text-[#f08a94]"
              >
                {error}
              </motion.p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal text-[15px] font-bold text-[#04231f] shadow-[0_14px_36px_-14px_rgba(25,198,173,0.9)] transition hover:bg-[#2adcc2] disabled:opacity-60"
            >
              {busy ? "Authenticating…" : "Sign in"}
              {busy ? null : (
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          {/* ------------------------------------------- demo credentials */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0e2033]/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={15} className="text-teal" />
              <h2 className="text-[13px] font-semibold text-white">Demo credentials</h2>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-slate-500">
                click to fill
              </span>
            </div>
            <div className="space-y-2">
              {USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => applyAccount(u.email, u.password)}
                  className="w-full rounded-xl border border-white/8 bg-white/3 p-3 text-left transition hover:border-teal/40 hover:bg-teal/6"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-[#06131c]"
                      style={{ background: u.avatarColor }}
                    >
                      {u.role.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold capitalize text-white">
                        {u.role} · {u.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-slate-400">
                        {u.email} / {u.password}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    {ROLE_NOTE[u.role]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ------------------------------------------------------ brand side */}
      <div className="grid-bg relative hidden items-center overflow-hidden border-l border-white/8 bg-[#071019] p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_460px_at_75%_10%,rgba(25,198,173,0.16),transparent_62%),radial-gradient(600px_420px_at_10%_95%,rgba(141,120,235,0.12),transparent_65%)]" />
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full max-w-lg"
        >
          <FabricScanner running sensitivity={80} compact cameraLabel="CAM 01" />

          <h2 className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight text-white">
            Real-time edge vision for RMG quality.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Detection → root-cause prediction → waste and cost estimation → automated QC report.
            Every stage runs on the factory floor, on hardware that costs about $520 per machine.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              ["38 ms", "inference"],
              ["96.4%", "accuracy"],
              ["0", "cloud calls"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/3 p-4">
                <p className="font-display text-xl font-bold text-teal">{v}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
