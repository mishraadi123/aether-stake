"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchRecentActivity } from "../../core/stellar/events";
import { convertStroopsToXlm } from "../../core/stellar/client";
import { Radio, PlayCircle, Ticket, Trophy, Ban, Vault, ArrowUpRight, RefreshCw } from "lucide-react";

const EVENT_META = {
  cycle_started: {
    icon: PlayCircle,
    chip: "np-chip-volt",
    label: "Cycle Started",
    describe: (ev) => `Cycle #${ev.roundId} opened for entries`,
  },
  coupon_minted: {
    icon: Ticket,
    chip: "np-chip-acid",
    label: "Coupon Minted",
    describe: (ev) => {
      const buyer = Array.isArray(ev.data) ? ev.data[0] : ev.data;
      const short = typeof buyer === "string" ? `${buyer.slice(0, 5)}…${buyer.slice(-4)}` : "a participant";
      return `${short} entered cycle #${ev.roundId}`;
    },
  },
  cycle_resolved: {
    icon: Trophy,
    chip: "np-chip-ink",
    label: "Winner Drawn",
    describe: (ev) => {
      const winner = Array.isArray(ev.data) ? ev.data[0] : ev.data;
      const short = typeof winner === "string" ? `${winner.slice(0, 5)}…${winner.slice(-4)}` : "the winner";
      return `Cycle #${ev.roundId} resolved — jackpot paid to ${short}`;
    },
  },
  cycle_cancelled: {
    icon: Ban,
    chip: "np-chip-alarm",
    label: "Cycle Voided",
    describe: (ev) => `Cycle #${ev.roundId} closed with zero entries`,
  },
  commission_received: {
    icon: Vault,
    chip: "np-chip-volt",
    label: "Vault Commission",
    describe: (ev) => {
      const amount = Array.isArray(ev.data) ? ev.data[0] : ev.data;
      const xlm = typeof amount === "bigint" || typeof amount === "number" ? convertStroopsToXlm(BigInt(amount)) : "?";
      return `${xlm} XLM commission from cycle #${ev.roundId} locked in vault`;
    },
  },
  reserve_disbursed: {
    icon: Vault,
    chip: "np-chip-ink",
    label: "Reserve Disbursed",
    describe: () => "Administrator withdrew from the commission vault",
  },
};

function timeAgo(iso) {
  if (!iso) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Activity() {
  const [events, setEvents] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadState("loading");
    try {
      const feed = await fetchRecentActivity(40);
      setEvents(feed);
      setLastSync(new Date());
      setLoadState("ready");
    } catch (err) {
      console.warn("event feed fetch failed", err);
      if (isInitial) setLoadState("error");
    }
  }, []);

  // Initial fetch + 8s polling keeps the feed live without a reload
  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 8000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="np-display text-2xl sm:text-3xl">Live feed</h1>
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
            Contract events streamed from Soroban RPC · refreshes every 8s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="np-live-dot" />
          <span className="np-mono text-[10px] uppercase font-bold">
            {lastSync ? `Synced ${timeAgo(lastSync.toISOString())}` : "Syncing…"}
          </span>
        </div>
      </div>

      {/* Feed */}
      {loadState === "loading" ? (
        <div className="np-card p-10 text-center">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-volt" />
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Scanning recent ledgers for protocol events…
          </p>
        </div>
      ) : loadState === "error" ? (
        <div className="np-card-flat border-alarm p-8 text-center shadow-[5px_5px_0_0_var(--alarm)]">
          <p className="np-display text-sm text-alarm mb-2">Feed unavailable</p>
          <p className="text-xs text-ink-soft mb-4">
            Could not reach Soroban RPC for event history. It retries automatically every 8 seconds.
          </p>
          <button onClick={() => load(true)} className="np-btn np-btn-ghost text-[11px] px-4 py-2">
            Retry now
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="np-card p-10 text-center">
          <Radio className="w-6 h-6 mx-auto mb-3 text-volt" />
          <p className="np-display text-sm mb-1">No recent events</p>
          <p className="text-xs text-ink-soft">
            The RPC&apos;s retention window has no protocol activity yet. Enter the
            current cycle and watch it appear here within seconds.
          </p>
        </div>
      ) : (
        <div className="np-card p-0 overflow-hidden">
          <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink flex justify-between items-center">
            <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
              Protocol Events
            </span>
            <span className="np-mono text-[10px] uppercase text-acid">{events.length} shown</span>
          </div>
          <ul>
            {events.map((ev, i) => {
              const meta = EVENT_META[ev.name] || {
                icon: Radio,
                chip: "np-chip",
                label: ev.name,
                describe: () => `Event on ledger ${ev.ledger}`,
              };
              const Icon = meta.icon;
              return (
                <li
                  key={ev.id || i}
                  className={`px-4 sm:px-5 py-3.5 flex items-center gap-3 ${i < events.length - 1 ? "border-b-2 border-ink" : ""}`}
                >
                  <div className="border-2 border-ink bg-bone w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`np-chip ${meta.chip}`}>{meta.label}</span>
                      <span className="np-mono text-[10px] text-ink-soft">
                        {timeAgo(ev.closedAt)} · ledger {ev.ledger}
                      </span>
                    </div>
                    <p className="text-xs truncate">{meta.describe(ev)}</p>
                  </div>
                  {ev.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="np-btn np-btn-ghost p-2 flex-shrink-0"
                      aria-label="View transaction on Stellar Expert"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="np-mono text-[10px] uppercase tracking-wider text-ink-soft text-center">
        Events are emitted on-chain by the pool &amp; vault contracts and read
        back via <span className="text-volt">getEvents</span> — nothing here is mocked.
      </p>
    </div>
  );
}
