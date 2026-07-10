"use client";

import { useState, useEffect } from "react";
import { useAetherWallet } from "../../modules/wallet/WalletProvider";
import { queryCycleDetails, convertStroopsToXlm } from "../../core/stellar/client";
import { Trophy, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Winners() {
  const { activeCycleSequence } = useAetherWallet();
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real winners only: query every cycle from the contract and keep the ones
  // that settled with a drawn winner (status 2).
  useEffect(() => {
    if (!activeCycleSequence) {
      setLoading(activeCycleSequence === 0 ? false : true);
      if (activeCycleSequence === 0) setResolved([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ids = Array.from({ length: activeCycleSequence }, (_, i) => i + 1);
        const details = await Promise.all(ids.map((id) => queryCycleDetails(id).catch(() => null)));
        if (!cancelled) {
          setResolved(
            details.filter((c) => c && c.status === 2 && c.winner).reverse()
          );
        }
      } catch (err) {
        console.warn("winner history fetch failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCycleSequence]);

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="np-display text-2xl sm:text-3xl">Winners</h1>
        <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
          Drawn on-chain · paid atomically · verifiable forever
        </p>
      </div>

      {loading ? (
        <div className="np-card p-10 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-volt" />
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Reading resolved cycles from the pool contract…
          </p>
        </div>
      ) : resolved.length === 0 ? (
        <div className="np-card p-10 text-center">
          <Trophy className="w-7 h-7 mx-auto mb-3 text-volt" />
          <p className="np-display text-sm mb-2">No winners drawn yet</p>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">
            The current deployment hasn&apos;t resolved a cycle with entries yet.
            The first winner will appear here the moment a draw settles —{" "}
            <Link href="/play" className="text-volt font-bold hover:underline">enter the live cycle</Link>{" "}
            to make it happen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {resolved.map((cycle) => {
            const payout = (BigInt(cycle.pot) * 95n) / 100n;
            return (
              <div key={cycle.round_id} className="np-card p-0 overflow-hidden">
                <div className="bg-volt text-paper px-5 py-3 border-b-2 border-ink flex items-center justify-between">
                  <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-acid" />
                    Cycle #{cycle.round_id}
                  </span>
                  <span className="np-chip np-chip-acid">Resolved</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="min-w-0">
                    <div className="np-label mb-1">Winning Account</div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${cycle.winner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="np-mono text-xs font-bold break-all hover:text-volt transition-colors inline-flex items-center gap-1"
                    >
                      {cycle.winner}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    <div className="np-mono text-[10px] text-ink-soft mt-2">
                      {cycle.ticket_count} entries · closed{" "}
                      {cycle.close_time ? new Date(cycle.close_time * 1000).toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="border-2 border-ink bg-acid px-4 py-3 text-center flex-shrink-0">
                    <div className="np-label mb-0.5">Payout (95%)</div>
                    <div className="np-mono font-tabular text-xl font-bold">
                      {convertStroopsToXlm(payout)} XLM
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="np-mono text-[10px] uppercase tracking-wider text-ink-soft text-center">
        Winner data is read live from contract storage — the draw transactions
        themselves are linked in the <Link href="/activity" className="text-volt hover:underline">live feed</Link>.
      </p>
    </div>
  );
}
