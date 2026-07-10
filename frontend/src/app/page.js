"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAetherWallet } from "../modules/wallet/WalletProvider";
import { convertStroopsToXlm } from "../core/stellar/client";
import { Ticket, Radio, Scale, Zap, ArrowRight, Vault, Timer, Trophy } from "lucide-react";

const STATUS_META = {
  0: { label: "Cycle Void", chip: "np-chip-alarm" },
  1: { label: "Live Now", chip: "np-chip-acid" },
  2: { label: "Resolved", chip: "np-chip-volt" },
};

/* The centerpiece: live cycle board with mono numerals and a running clock */
function LiveCycleBoard() {
  const { cycleDetails, activeCycleSequence } = useAetherWallet();
  const [clock, setClock] = useState("--:--");
  const [potFlash, setPotFlash] = useState(false);
  const lastPot = useRef(cycleDetails.pot);

  // 1-second countdown driven by the on-chain close_time
  useEffect(() => {
    if (!cycleDetails.close_time || cycleDetails.status !== 1) {
      setClock(cycleDetails.status === 2 ? "DONE" : "--:--");
      return;
    }
    const tick = () => {
      const diff = cycleDetails.close_time - Math.floor(Date.now() / 1000);
      if (diff <= 0) {
        setClock("00:00");
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setClock(
        h > 0
          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cycleDetails.close_time, cycleDetails.status]);

  // Flash the pot readout when polling picks up a new entry
  useEffect(() => {
    if (lastPot.current !== cycleDetails.pot) {
      lastPot.current = cycleDetails.pot;
      setPotFlash(true);
      const t = setTimeout(() => setPotFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [cycleDetails.pot]);

  const status = STATUS_META[cycleDetails.status] || STATUS_META[1];
  const potXlm = convertStroopsToXlm(BigInt(cycleDetails.pot || "0"));

  return (
    <div className="np-card p-0 overflow-hidden">
      {/* Board header */}
      <div className="bg-ink text-bone px-5 py-3 flex items-center justify-between border-b-2 border-ink">
        <div className="flex items-center gap-2.5">
          <span className="np-live-dot" />
          <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
            Cycle #{activeCycleSequence || "—"}
          </span>
        </div>
        <span className={`np-chip ${status.chip}`}>{status.label}</span>
      </div>

      {/* Pot readout */}
      <div className={`px-5 sm:px-8 py-8 sm:py-10 text-center ${potFlash ? "np-flash" : ""}`}>
        <div className="np-label mb-3">Current Prize Pool</div>
        <div className="np-mono font-tabular text-5xl sm:text-7xl font-bold tracking-tight break-all">
          {potXlm}
          <span className="text-xl sm:text-3xl ml-2 text-volt">XLM</span>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 border-t-2 border-ink">
        <div className="px-3 py-4 text-center border-r-2 border-ink">
          <div className="np-label mb-1">Countdown</div>
          <div className="np-mono font-tabular text-lg sm:text-2xl font-bold flex items-center justify-center gap-1.5">
            <Timer className="w-4 h-4 text-volt" />
            {clock}
          </div>
        </div>
        <div className="px-3 py-4 text-center border-r-2 border-ink">
          <div className="np-label mb-1">Entries</div>
          <div className="np-mono font-tabular text-lg sm:text-2xl font-bold">
            {cycleDetails.ticket_count}
          </div>
        </div>
        <div className="px-3 py-4 text-center">
          <div className="np-label mb-1">Per Coupon</div>
          <div className="np-mono font-tabular text-lg sm:text-2xl font-bold">
            {convertStroopsToXlm(BigInt(cycleDetails.ticket_price || "0"))}
            <span className="text-xs ml-1">XLM</span>
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div className="border-t-2 border-ink np-stripes bg-acid px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="np-mono text-[11px] font-bold uppercase tracking-wider">
          95% to winner · 5% to vault · drawn on-chain
        </span>
        <Link href="/play" className="np-btn np-btn-ink text-[11px] px-5 py-2.5 inline-flex items-center gap-2">
          Enter Cycle
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { accruedCommissions } = useAetherWallet();

  return (
    <div className="flex flex-col gap-12 sm:gap-16 animate-fade-in">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-4">
        <div className="flex flex-col gap-6">
          <span className="np-chip np-chip-volt self-start">
            <Zap className="w-3 h-3" fill="currentColor" />
            Stellar Soroban · Testnet
          </span>
          <h1 className="np-display text-4xl sm:text-5xl lg:text-6xl">
            Provably
            <br />
            random
            <br />
            <span className="text-volt">prize cycles.</span>
          </h1>
          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-md">
            Buy entry coupons into a timed pool. When the clock hits zero, the
            contract derives a winner from the ledger itself — no oracle, no
            operator, no trust required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/play" className="np-btn np-btn-volt text-xs px-6 py-3 inline-flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Participate
            </Link>
            <Link href="/activity" className="np-btn np-btn-ghost text-xs px-6 py-3 inline-flex items-center gap-2">
              <Radio className="w-4 h-4" />
              Live Feed
            </Link>
          </div>
        </div>

        <LiveCycleBoard />
      </section>

      {/* Protocol stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: Trophy,
            title: "Winner Takes 95%",
            body: "The draw pays the jackpot directly to the winning coupon holder's account in the same atomic transaction.",
          },
          {
            icon: Vault,
            title: `${convertStroopsToXlm(BigInt(accruedCommissions || "0"))} XLM in Vault`,
            body: "A 5% commission routes to an isolated vault contract via a cross-contract call — auditable on-chain, live above.",
          },
          {
            icon: Scale,
            title: "Ledger-Derived Draws",
            body: "Winner index = SHA-256 over ledger sequence, timestamp, cycle id and entry count. Verify every draw yourself.",
          },
        ].map((card) => (
          <div key={card.title} className="np-card-flat p-5 hover:shadow-[5px_5px_0_0_var(--ink)] transition-shadow">
            <card.icon className="w-6 h-6 text-volt mb-3" />
            <h3 className="np-display text-sm mb-2">{card.title}</h3>
            <p className="text-xs text-ink-soft leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>

      {/* How it works strip */}
      <section className="np-card p-0 overflow-hidden">
        <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink">
          <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
            Cycle Lifecycle
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            { n: "01", t: "Cycle Opens", d: "The administrator starts a timed sweepstakes cycle with a fixed coupon price." },
            { n: "02", t: "Coupons Minted", d: "Each entry pulls 1 XLM into the pool and mints a coupon token via cross-contract call." },
            { n: "03", t: "Clock Hits Zero", d: "Entries close the instant the on-chain close time passes. No late tickets, ever." },
            { n: "04", t: "Draw & Payout", d: "Anyone can trigger the draw: winner picked from ledger entropy, funds dispersed atomically." },
          ].map((step, i) => (
            <div key={step.n} className={`p-5 ${i < 3 ? "md:border-r-2" : ""} ${i > 0 ? "border-t-2 md:border-t-0" : ""} border-ink`}>
              <div className="np-mono text-3xl font-bold text-volt mb-2">{step.n}</div>
              <h4 className="np-display text-xs mb-2">{step.t}</h4>
              <p className="text-[11px] text-ink-soft leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
