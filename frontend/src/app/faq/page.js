"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "Is this real money?",
      a: "No. Windfall operates entirely on the Stellar Testnet. All transactions use testnet XLM which holds no monetary or real-world value. It is exclusively a technical showcase."
    },
    {
      q: "How is the winner picked?",
      a: "The winner is drawn when a user triggers 'Settle Round'. The coordinator contract hashes entropy from the current ledger timestamp, sequence number, round ID, and ticket count. The resulting hash is mapped to a winning ticket index and resolved to the owner's address via the Ticket contract."
    },
    {
      q: "What is the fee?",
      a: "Each settled round pool incurs a fixed 5% (500 bps) fee that is transferred to the Treasury contract. The remaining 95% is instantly paid out to the winner."
    },
    {
      q: "Which wallets work?",
      a: "Any wallet supporting the Stellar Wallets Kit can be connected. Freighter Wallet is the primary recommended extension. Albedo, Rabet, and xBull are also supported."
    },
    {
      q: "What if a round has no tickets?",
      a: "If the countdown timer expires and zero tickets have been purchased, the round is voided upon settlement, returning the coordinator status to inactive without draws or payouts."
    },
    {
      q: "Can I buy multiple tickets?",
      a: "Yes! You can buy multiple tickets to increase your draw odds. The UI quantity selector allows buying up to 5 tickets in a single sequence transaction to prevent ledger collision sequence errors."
    },
    {
      q: "Is the randomness fair?",
      a: "Yes, the draw maps directly to ticket indices. However, since the entropy is derived from ledger headers (timestamp, sequence), block validators could theoretically simulate outcomes ahead of submission. This is suitable for demonstration apps, but mainnet releases should utilize a decentralized oracle like Pyth VRF."
    }
  ];

  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-[#1C1B18]">Frequently Asked Questions</h2>
        <p className="text-xs text-[#6E6C64] mt-1">
          Everything you need to know about the Windfall prize pool protocol.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white border border-[#EBE9E1] rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-[#FAF9F5]/40 transition-colors"
              >
                <span className="text-sm font-extrabold text-[#1C1B18] flex items-center gap-3">
                  <HelpCircle className="w-4.5 h-4.5 text-[#E75A3B] flex-shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#6E6C64] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="px-6 pb-5 text-xs text-[#6E6C64] leading-relaxed border-t border-[#FAF9F5] pt-4 bg-[#FAF9F5]/10">
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
