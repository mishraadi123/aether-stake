"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is this real money?",
    a: "No. Aether Sweepstakes operates entirely on the Stellar Testnet. All transactions use testnet XLM which holds no monetary or real-world value. It is exclusively a technical sandbox."
  },
  {
    q: "How is the winner selected?",
    a: "The winner is selected when a user triggers the draw. The pool contract hashes entropy from the current ledger timestamp, sequence number, cycle ID, and coupon count. The resulting hash maps to a winning index, resolved to the owner's address via the Sweep Coupon contract."
  },
  {
    q: "What is the fee?",
    a: "Each settled pool incurs a fixed 5% (500 bps) commission that is transferred to the Commission Vault contract. The remaining 95% is instantly paid out to the winner."
  },
  {
    q: "Which wallets work?",
    a: "Any wallet supporting the Stellar Wallets Kit can be connected. Freighter is the primary recommended extension; Albedo, Rabet, and xBull are also supported."
  },
  {
    q: "What if a cycle has no entries?",
    a: "If the countdown expires with zero entry coupons purchased, settlement voids the cycle — no draw, no payouts — and the administrator can open the next one."
  },
  {
    q: "Can I acquire multiple coupons?",
    a: "Yes. Each coupon is an independent entry, so more coupons means better odds. The UI batches up to 5 per request to avoid ledger sequence collisions."
  },
  {
    q: "Is the randomness fair?",
    a: "The draw maps uniformly onto coupon indices, and no operator input is involved. Because the entropy derives from ledger headers, validators could theoretically simulate outcomes ahead of inclusion — acceptable for a testnet demo; a mainnet release should use a VRF. See the Fairness page for the full breakdown."
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="np-display text-2xl sm:text-3xl">FAQ</h1>
        <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
          Straight answers about the protocol
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className={isOpen ? "np-card" : "np-card-flat hover:shadow-[5px_5px_0_0_var(--ink)] transition-shadow"}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left flex justify-between items-center gap-4"
                aria-expanded={isOpen}
              >
                <span className="np-mono text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                  <span className="text-volt">{String(idx + 1).padStart(2, "0")}</span>
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-volt" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-4 text-xs leading-relaxed text-ink-soft border-t-2 border-ink">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
