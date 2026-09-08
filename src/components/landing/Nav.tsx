"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#how", label: "How it works" },
  { href: "#defects", label: "What it sees" },
  { href: "#proof", label: "Accuracy" },
  { href: "#hardware", label: "Hardware" },
  { href: "#impact", label: "Impact" },
  { href: "#roi", label: "ROI" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/10 bg-[#08131f]/90 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-teal/30 bg-teal/10">
            <span className="h-3 w-3 rounded-full bg-teal shadow-[0_0_14px_#19c6ad]" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            TexVision<span className="text-teal">.AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex xl:gap-7">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-slate-300 transition hover:text-teal"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg border border-white/15 px-4 py-2 text-[13px] font-semibold text-slate-200 transition hover:border-teal/60 hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-teal px-4 py-2 text-[13px] font-bold text-[#04231f] shadow-[0_10px_30px_-12px_rgba(25,198,173,0.9)] transition hover:bg-[#2adcc2]"
          >
            Open dashboard
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-white/10 bg-[#08131f]/97 px-5 py-4 lg:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-slate-300"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
