"use client";

import Link from "next/link";
import { ShieldAlert, CheckCircle2, Layers, ArrowRight, ArrowDown } from "lucide-react";

function FlowNode({ children, dark = false }) {
  return (
    <div className={`border-2 border-ink px-4 py-2.5 text-center np-mono text-[11px] font-bold w-full sm:w-auto ${dark ? "bg-ink text-bone" : "bg-paper"}`}>
      {children}
    </div>
  );
}

function FlowArrow({ label }) {
  return (
    <div className="flex sm:flex-col items-center gap-1 text-volt">
      <ArrowRight className="w-4 h-4 hidden sm:block" />
      <ArrowDown className="w-4 h-4 sm:hidden" />
      <span className="np-mono text-[9px] font-bold uppercase">{label}</span>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="np-display text-2xl sm:text-3xl">Protocol specs</h1>
        <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
          Contract logic · draw parameters · cross-contract topology
        </p>
      </div>

      {/* Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="np-card-flat p-5 flex flex-col gap-3">
          <h3 className="np-label flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-mint" />
            Core Mechanics
          </h3>
          <ul className="text-xs text-ink-soft flex flex-col gap-3 leading-relaxed">
            <li className="border-l-4 border-volt pl-3">
              <strong className="text-ink">Timed cycles.</strong> Each cycle opens with a fixed
              duration; coupons can only be minted while the on-chain clock runs.
            </li>
            <li className="border-l-4 border-volt pl-3">
              <strong className="text-ink">Coupon mints.</strong> Every entry pulls 1 XLM into the
              pool and mints a coupon token recording your participation.
            </li>
            <li className="border-l-4 border-volt pl-3">
              <strong className="text-ink">95 / 5 split.</strong> Settlement pays 95% of the pot to
              the drawn winner and routes 5% into the commission vault.
            </li>
          </ul>
        </div>

        <div className="np-card-flat p-5 flex flex-col gap-3">
          <h3 className="np-label flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-alarm" />
            Pseudo-Random Draw
          </h3>
          <div className="overflow-x-auto border-2 border-ink bg-ink">
            <pre className="np-mono text-[10px] leading-relaxed p-3.5 text-acid whitespace-pre min-w-max">
{`let mut data = Bytes::new(&env);
data.extend_from_array(&timestamp);
data.extend_from_array(&sequence);
data.extend_from_array(&round_id);
data.extend_from_array(&ticket_count);

let hash = env.crypto().sha256(&data);
let seed = first_8_bytes_as_u64(hash);
let winner_idx = seed % ticket_count;`}
            </pre>
          </div>
          <p className="text-[11px] text-ink-soft leading-relaxed">
            Ledger-header entropy is transparent and operator-free, but validators
            could theoretically pre-simulate outcomes. Full analysis on the{" "}
            <Link href="/fairness" className="text-volt font-bold hover:underline">Fairness page</Link>.
          </p>
        </div>
      </div>

      {/* Inter-contract topology */}
      <div className="np-card p-0 overflow-hidden">
        <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink flex items-center gap-2">
          <Layers className="w-4 h-4 text-acid" />
          <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
            Inter-Contract Call Topology
          </span>
        </div>

        <div className="p-5 sm:p-7 flex flex-col gap-8">
          <div>
            <h4 className="np-label mb-4">Flow 1 — purchase_entry_ticket()</h4>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <FlowNode>Participant</FlowNode>
              <FlowArrow label="purchase_entry_ticket" />
              <FlowNode dark>Aether Pool</FlowNode>
              <FlowArrow label="issue_entry_coupon" />
              <FlowNode>Sweep Coupon</FlowNode>
            </div>
            <p className="text-[11px] text-ink-soft mt-3 leading-relaxed">
              The pool verifies cycle rules, pulls the XLM stake via the native
              asset contract, then makes a cross-contract call with{" "}
              <code className="np-mono text-volt">env.invoke_contract</code> to mint the entry
              coupon on the Sweep Coupon contract — one atomic transaction.
            </p>
          </div>

          <div className="border-t-2 border-ink pt-7">
            <h4 className="np-label mb-4">Flow 2 — resolve_and_draw()</h4>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <FlowNode dark>Aether Pool</FlowNode>
              <FlowArrow label="resolve_coupon_holder" />
              <FlowNode>Sweep Coupon</FlowNode>
              <FlowArrow label="transfer + record_commission" />
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <FlowNode>Winner · 95%</FlowNode>
                <FlowNode>Vault · 5%</FlowNode>
              </div>
            </div>
            <p className="text-[11px] text-ink-soft mt-3 leading-relaxed">
              Settlement derives the winning index from ledger entropy, resolves it
              to an address via <code className="np-mono text-volt">resolve_coupon_holder</code>,
              pays the winner, then transfers the commission and invokes{" "}
              <code className="np-mono text-volt">record_commission</code> on the vault — all
              inside a single atomic invocation. If any step fails, everything reverts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
