"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Bot,
  Cpu,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  ScanLine,
  Settings,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { NOW } from "@/lib/analytics";
import { cn, timeAgo } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[];
  group: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, group: "Monitor" },
  { href: "/dashboard/live", label: "Live inspection", icon: ScanLine, group: "Monitor" },
  { href: "/dashboard/defects", label: "Defect records", icon: TriangleAlert, group: "Monitor" },
  { href: "/dashboard/machines", label: "Machines", icon: Wrench, group: "Factory" },
  { href: "/dashboard/devices", label: "IoT devices", icon: Cpu, group: "Factory" },
  { href: "/dashboard/analytics", label: "Root-cause AI", icon: Radar, group: "Intelligence" },
  { href: "/dashboard/waste", label: "Waste & cost", icon: FileBarChart, group: "Intelligence" },
  { href: "/dashboard/assistant", label: "AI assistant", icon: Bot, group: "Intelligence" },
  { href: "/dashboard/reports", label: "QC reports", icon: FileBarChart, group: "Compliance" },
  {
    href: "/dashboard/users", label: "Users & access", icon: Users, group: "Admin",
    roles: ["admin"],
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, group: "Admin" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, ready, logout, alerts, acknowledgeAlert, clearAlerts } = useStore();
  const [sidebar, setSidebar] = useState(false);
  const [bell, setBell] = useState(false);

  useEffect(() => {
    if (ready && !currentUser) router.replace("/login");
  }, [ready, currentUser, router]);

  const items = useMemo(
    () => NAV.filter((n) => !n.roles || (currentUser && n.roles.includes(currentUser.role))),
    [currentUser],
  );

  const groups = useMemo(() => {
    const g: Record<string, NavItem[]> = {};
    for (const it of items) (g[it.group] ??= []).push(it);
    return g;
  }, [items]);

  const unread = alerts.filter((a) => !a.acknowledged).length;

  if (!ready || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a1623]">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="h-2 w-2 animate-soft-pulse rounded-full bg-teal" />
          Loading console…
        </div>
      </div>
    );
  }

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-teal/30 bg-teal/10">
          <span className="h-3 w-3 rounded-full bg-teal shadow-[0_0_12px_#19c6ad]" />
        </span>
        <div>
          <p className="font-display text-[15px] font-bold leading-none tracking-tight text-white">
            TexVision<span className="text-teal">.AI</span>
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Console v1.4
          </p>
        </div>
        <button
          onClick={() => setSidebar(false)}
          className="ml-auto text-slate-400 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
              {group}
            </p>
            <div className="space-y-0.5">
              {list.map((n) => {
                const active =
                  n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => {
                      setSidebar(false);
                      setBell(false);
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition",
                      active
                        ? "bg-teal/10 text-white"
                        : "text-slate-400 hover:bg-white/4 hover:text-white",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal"
                      />
                    ) : null}
                    <n.icon
                      size={16}
                      className={active ? "text-teal" : "text-slate-500 group-hover:text-slate-300"}
                    />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/4 p-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-[#06131c]"
            style={{ background: currentUser.avatarColor }}
          >
            {currentUser.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{currentUser.name}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-teal">
              {currentUser.role}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-[#e05c68]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a1623]">
      {/* ------------------------------------------------ desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-[#08131f] lg:block">
        {sidebarInner}
      </aside>

      {/* ------------------------------------------------- mobile sidebar */}
      <AnimatePresence>
        {sidebar ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebar(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/8 bg-[#08131f] lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {sidebarInner}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* -------------------------------------------------------- content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/8 bg-[#0a1623]/92 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebar(true)}
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-teal/25 bg-teal/8 px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-teal" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-teal">
              Edge nodes live
            </span>
          </div>

          <p className="ml-auto hidden font-mono text-[11px] uppercase tracking-wider text-slate-500 md:block">
            Nasir Textiles Ltd · Gazipur · Floor 2
          </p>

          {/* alerts */}
          <div className="relative">
            <button
              onClick={() => setBell((b) => !b)}
              className="relative rounded-lg p-2 text-slate-300 transition hover:bg-white/6"
              aria-label="Alerts"
            >
              <Bell size={18} />
              {unread ? (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e05c68] px-1 text-[9px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>

            <AnimatePresence>
              {bell ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/12 bg-[#0d1f31] shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <p className="text-[13px] font-semibold text-white">Alerts</p>
                    <button
                      onClick={clearAlerts}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-[#e05c68]"
                    >
                      <Trash2 size={12} /> Clear all
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-slate-500">
                        No alerts right now.
                      </p>
                    ) : (
                      alerts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => acknowledgeAlert(a.id)}
                          className={cn(
                            "flex w-full gap-3 border-b border-white/6 px-4 py-3 text-left transition hover:bg-white/4",
                            a.acknowledged ? "opacity-55" : "",
                          )}
                        >
                          <ShieldAlert
                            size={15}
                            className={cn(
                              "mt-0.5 shrink-0",
                              a.level === "Critical"
                                ? "text-[#e05c68]"
                                : a.level === "Warning"
                                  ? "text-amber"
                                  : "text-teal",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-white">{a.title}</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                              {a.message}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-slate-600">
                              {timeAgo(a.at, NOW)} · {a.machineId}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
