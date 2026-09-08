"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, RotateCcw, Send, Sparkles, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { SUGGESTED_QUESTIONS, answerQuestion } from "@/lib/ai";
import { Badge, Button, Card, CardHeader, PageHeading } from "@/components/ui";
import type { ChatMessage } from "@/lib/types";

export default function AssistantPage() {
  const { chat, pushChat, resetChat, defects, machines, devices, currentUser } = useStore();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, thinking]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || thinking) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: q,
      at: new Date().toISOString(),
    };
    pushChat(userMsg);
    setInput("");
    setThinking(true);

    // Simulated latency so the reasoning step is visible.
    window.setTimeout(
      () => {
        pushChat({
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content: answerQuestion(q, { defects, machines, devices }),
          at: new Date().toISOString(),
        });
        setThinking(false);
      },
      700 + Math.random() * 600,
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Intelligence"
        title="AI assistant"
        description="Ask questions about the factory in plain language. The assistant reads the same live defect, machine and device data the dashboard shows and answers from it."
        action={
          chat.length ? (
            <Button variant="outline" onClick={resetChat}>
              <RotateCcw size={15} /> New conversation
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="flex h-[calc(100vh-16rem)] min-h-[520px] flex-col">
          {/* ---------------------------------------------------- thread */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!chat.length ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal/12 text-teal">
                  <Bot size={26} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    Ask about the floor
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                    Try &ldquo;which machine is performing worst this week?&rdquo; or &ldquo;how much
                    waste did we record?&rdquo; — the answer is computed from the current dataset,
                    not from a canned script.
                  </p>
                </div>
              </div>
            ) : null}

            <AnimatePresence initial={false}>
              {chat.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      m.role === "user"
                        ? "bg-white/8 text-slate-300"
                        : "bg-teal/12 text-teal"
                    }`}
                  >
                    {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </span>
                  <div
                    className={`max-w-[min(42rem,85%)] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-teal/12 text-white"
                        : "border border-white/8 bg-white/3 text-slate-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {thinking ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal/12 text-teal">
                  <Bot size={15} />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-teal"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                  <span className="ml-2 text-[12px] text-slate-500">
                    reading the defect register…
                  </span>
                </div>
              </motion.div>
            ) : null}

            <div ref={endRef} />
          </div>

          {/* ---------------------------------------------------- composer */}
          <div className="border-t border-white/8 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about defects, machines, waste, devices or reports…"
                className="flex-1 rounded-lg border border-white/10 bg-[#0a1a2a] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-teal/60 focus:ring-2 focus:ring-teal/20"
              />
              <Button type="submit" disabled={!input.trim() || thinking} className="px-4">
                <Send size={16} />
              </Button>
            </form>
            <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-slate-600">
              Demonstration assistant · answers computed locally from the dummy dataset
            </p>
          </div>
        </Card>

        {/* --------------------------------------------------------- side */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Try asking" subtitle="Click to send" />
            <div className="space-y-2 p-5 pt-4">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  disabled={thinking}
                  className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-3 text-left text-[13px] leading-snug text-slate-300 transition hover:border-teal/40 hover:bg-teal/6 hover:text-white disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Data in scope" />
            <div className="space-y-2.5 p-5 pt-4">
              {[
                ["Defect records", defects.length.toString()],
                ["Machines", machines.length.toString()],
                ["IoT devices", devices.length.toString()],
                ["Signed in as", currentUser?.role ?? "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-400">{l}</span>
                  <span className="font-mono text-[12px] capitalize text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mx-5 mb-5 flex gap-2.5 rounded-xl border border-amber/22 bg-amber/6 p-3.5">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                No language model is called. Answers are computed by rules over the local dataset —
                the workflow is real, the intelligence is simulated.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <Badge tone="teal">
              <Bot size={11} /> Assistant v1.4
            </Badge>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              In production this endpoint would sit on the factory gateway, answering from the same
              local defect database so no production data leaves the site.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
