"use client";

import { useState, useEffect } from "react";
import { useAetherWallet } from "../../modules/wallet/WalletProvider";
import { queryCycleDetails, convertStroopsToXlm } from "../../core/stellar/client";
import { ExternalLink, Loader2, Radio } from "lucide-react";
import Link from "next/link";

const STATUS_META = {
  0: { label: "Voided", chip: "np-chip-alarm" },
  1: { label: "Active", chip: "np-chip-acid" },
  2: { label: "Resolved", chip: "np-chip-volt" },
};

export default function Rounds() {
  const { activeCycleSequence } = useAetherWallet();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Query every cycle 1..active straight from the contract — no cached or
  // mocked history. Each row is a live read of on-chain persistent storage.
  useEffect(() => {
    if (!activeCycleSequence) {
      setLoading(activeCycleSequence === 0 ? false : true);
      if (activeCycleSequence === 0) setCycles([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ids = Array.from({ length: activeCycleSequence }, (_, i) => i + 1);
        const details = await Promise.all(ids.map((id) => queryCycleDetails(id).catch(() => null)));
        if (!cancelled) setCycles(details.filter(Boolean).reverse());
      } catch (err) {
        console.warn("cycle history fetch failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCycleSequence]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="np-display text-2xl sm:text-3xl">Cycle ledger</h1>
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
            Every cycle, read live from contract storage
          </p>
        </div>
        <Link href="/activity" className="np-btn np-btn-ghost text-[10px] px-3 py-2 inline-flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" />
          Draw txs in live feed
        </Link>
      </div>

      {loading ? (
        <div className="np-card p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-volt" />
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Reading cycle history from the pool contract…
          </p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="np-card p-10 text-center">
          <p className="np-display text-sm mb-2">No cycles yet</p>
          <p className="text-xs text-ink-soft">
            The protocol hasn&apos;t opened its first sweepstakes cycle. History will
            populate here the moment it does.
          </p>
        </div>
      ) : (
        <div className="np-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-ink text-bone">
                  {["Cycle", "Pool (XLM)", "Entries", "Winner", "Status"].map((h) => (
                    <th key={h} className="np-mono text-[10px] uppercase tracking-[0.15em] font-bold py-3 px-4 sm:px-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle, i) => {
                  const status = STATUS_META[cycle.status] || STATUS_META[1];
                  return (
                    <tr key={cycle.round_id} className={`text-xs ${i < cycles.length - 1 ? "border-b-2 border-ink" : ""} hover:bg-bone transition-colors`}>
                      <td className="py-3.5 px-4 sm:px-5 np-mono font-bold">#{cycle.round_id}</td>
                      <td className="py-3.5 px-4 sm:px-5 np-mono font-tabular font-bold text-volt">
                        {convertStroopsToXlm(BigInt(cycle.pot))}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 np-mono font-tabular">{cycle.ticket_count}</td>
                      <td className="py-3.5 px-4 sm:px-5 np-mono">
                        {cycle.winner ? (
                          <a
                            href={`https://stellar.expert/explorer/testnet/account/${cycle.winner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-volt transition-colors inline-flex items-center gap-1"
                          >
                            {cycle.winner.slice(0, 5)}…{cycle.winner.slice(-4)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5">
                        <span className={`np-chip ${status.chip}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="np-mono text-[10px] uppercase tracking-wider text-ink-soft text-center">
        Draw transaction hashes for resolved cycles appear in the{" "}
        <Link href="/activity" className="text-volt hover:underline">live feed</Link>{" "}
        with direct Stellar Expert links.
      </p>
    </div>
  );
}
