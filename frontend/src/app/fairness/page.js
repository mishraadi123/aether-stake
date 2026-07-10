"use client";

import { useState } from "react";
import { queryCycleDetails, convertStroopsToXlm, AETHER_POOL_ID } from "../../core/stellar/client";
import { Scale, Search, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";

/* Verbatim draw logic from contracts/aether_pool/src/lib.rs (resolve_and_draw) */
const DRAW_SOURCE = `// Draw winner via pseudo-randomness
let mut data = Bytes::new(&env);
data.extend_from_array(&env.ledger().timestamp().to_be_bytes());
data.extend_from_array(&(env.ledger().sequence() as u64).to_be_bytes());
data.extend_from_array(&(round_id as u64).to_be_bytes());
data.extend_from_array(&(round.ticket_count as u64).to_be_bytes());

let hash = env.crypto().sha256(&data);
let seed_as_u64 = u64::from_be_bytes(hash[0..8]);
let winning_index = (seed_as_u64 % ticket_count) as u32;

// Resolve winning index -> Address (cross-contract call)
let winner: Address = env.invoke_contract(
    &coupon_issuer,
    &Symbol::new(&env, "resolve_coupon_holder"),
    vec![&env, round_id, winning_index],
);`;

const INPUTS = [
  { name: "ledger timestamp", detail: "Close time of the ledger that includes the draw transaction — not known in advance." },
  { name: "ledger sequence", detail: "The ledger number the draw lands in. Attackers can't choose it precisely." },
  { name: "cycle id", detail: "Namespaces each draw so two cycles never share a seed." },
  { name: "entry count", detail: "Total coupons issued — fixed once the cycle closes." },
];

const STATUS_LABELS = {
  0: { text: "Voided — no entries", chip: "np-chip-alarm" },
  1: { text: "Still open", chip: "np-chip-acid" },
  2: { text: "Resolved", chip: "np-chip-volt" },
};

function CycleVerifier() {
  const [roundInput, setRoundInput] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    const id = parseInt(roundInput, 10);
    if (!id || id < 1) {
      setError("Enter a cycle number (1 or higher).");
      return;
    }
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const details = await queryCycleDetails(id);
      setResult(details);
    } catch {
      setError(`Cycle #${id} was not found on-chain.`);
    } finally {
      setChecking(false);
    }
  };

  const status = result ? STATUS_LABELS[result.status] || STATUS_LABELS[1] : null;

  return (
    <div className="np-card p-0 overflow-hidden">
      <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink">
        <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
          Verify a Cycle
        </span>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <input
            type="number"
            min="1"
            value={roundInput}
            onChange={(e) => setRoundInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Cycle #"
            className="np-input flex-1 text-sm"
          />
          <button
            onClick={check}
            disabled={checking}
            className="np-btn np-btn-volt text-[11px] px-5 flex items-center gap-1.5"
          >
            {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Check
          </button>
        </div>

        {error && <p className="np-mono text-[11px] text-alarm">{error}</p>}

        {result && (
          <div className="border-2 border-ink bg-bone p-4 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-soft">Status</span>
              <span className={`np-chip ${status.chip}`}>{status.text}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-soft">Entries</span>
              <span className="np-mono font-bold">{result.ticket_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-soft">Pool</span>
              <span className="np-mono font-bold">{convertStroopsToXlm(BigInt(result.pot))} XLM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-soft">Close time</span>
              <span className="np-mono font-bold">
                {result.close_time ? new Date(result.close_time * 1000).toLocaleString() : "—"}
              </span>
            </div>
            {result.winner && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-ink-soft flex-shrink-0">Winner</span>
                <span className="np-mono font-bold truncate">{result.winner}</span>
              </div>
            )}
          </div>
        )}

        <p className="np-mono text-[10px] uppercase tracking-wider text-ink-soft">
          Read live from the pool contract via simulation — zero cached data.
        </p>
      </div>
    </div>
  );
}

export default function Fairness() {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 animate-fade-in">
      {/* Heading */}
      <div>
        <span className="np-chip np-chip-volt mb-4">
          <Scale className="w-3 h-3" />
          Provable Fairness
        </span>
        <h1 className="np-display text-2xl sm:text-4xl mb-3">
          Every draw is
          <br />
          <span className="text-volt">math, not trust.</span>
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed max-w-xl">
          The winner of each cycle is computed inside the smart contract from
          public ledger state. No operator input, no off-chain randomness
          service, nothing to rig. This page shows exactly how — and lets you
          audit any past cycle against the chain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: mechanism */}
        <div className="flex flex-col gap-6">
          <div className="np-card p-0 overflow-hidden">
            <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink">
              <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
                The Draw — Contract Source
              </span>
            </div>
            <div className="overflow-x-auto">
              <pre className="np-mono text-[10.5px] leading-relaxed p-4 whitespace-pre min-w-max">
                {DRAW_SOURCE}
              </pre>
            </div>
            <div className="border-t-2 border-ink bg-acid px-5 py-2.5">
              <span className="np-mono text-[10px] font-bold uppercase tracking-wider">
                Verbatim from contracts/aether_pool/src/lib.rs
              </span>
            </div>
          </div>

          <div className="np-card-flat p-5">
            <h3 className="np-label mb-4">Seed Inputs</h3>
            <ul className="flex flex-col gap-3">
              {INPUTS.map((input) => (
                <li key={input.name} className="flex gap-3 items-start">
                  <ShieldCheck className="w-4 h-4 text-volt flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="np-mono text-[11px] font-bold uppercase">{input.name}</div>
                    <p className="text-[11px] text-ink-soft leading-relaxed mt-0.5">{input.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: verifier + notes */}
        <div className="flex flex-col gap-6">
          <CycleVerifier />

          <div className="np-card-flat p-5">
            <h3 className="np-label mb-3">Honest Limitations</h3>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              Ledger-derived entropy is <strong className="text-ink">pseudo-random</strong>:
              a validator could theoretically bias results by choosing when to
              include the draw transaction. For a testnet demonstration this is a
              deliberate, documented trade-off — a production deployment would
              swap this seed for a commit-reveal scheme or a verifiable random
              function without touching the rest of the architecture.
            </p>
          </div>

          <a
            href={`https://stellar.expert/explorer/testnet/contract/${AETHER_POOL_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="np-btn np-btn-ghost text-[11px] px-5 py-3 inline-flex items-center justify-center gap-2"
          >
            Inspect the pool contract on Stellar Expert
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
