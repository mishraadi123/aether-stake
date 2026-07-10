"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAetherWallet } from "../wallet/WalletProvider";
import {
  AETHER_POOL_ID,
  SWEEP_COUPON_ID,
  COMMISSION_VAULT_ID,
} from "../../core/stellar/client";
import { Wallet, Zap, ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Play", href: "/play" },
  { name: "Live Feed", href: "/activity" },
  { name: "Cycles", href: "/rounds" },
  { name: "Winners", href: "/winners" },
  { name: "Fairness", href: "/fairness" },
];

const FOOTER_LINKS = [
  { name: "Protocol Specs", href: "/how-it-works" },
  { name: "About", href: "/about" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

const TICKER_ITEMS = [
  "SOROBAN TESTNET — NO REAL FUNDS",
  "PROVABLY RANDOM ON-CHAIN DRAWS",
  "95% OF POOL PAID TO WINNER",
  "5% COMMISSION TO VAULT",
  "1 XLM PER ENTRY COUPON",
  "AETHER SWEEPSTAKES PROTOCOL v1",
];

function TickerStrip() {
  const row = TICKER_ITEMS.map((item, i) => (
    <span key={i} className="np-mono text-[10px] font-bold uppercase tracking-widest px-6 whitespace-nowrap flex items-center gap-2">
      <Zap className="w-3 h-3" fill="currentColor" />
      {item}
    </span>
  ));
  return (
    <div className="bg-acid text-ink border-b-2 border-ink overflow-hidden py-1.5" aria-hidden="true">
      <div className="np-marquee">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const { connectedAddress, xlmBalance, establishConnection, terminateConnection } = useAetherWallet();

  return (
    <div className="flex flex-col min-h-screen bg-bone text-ink">
      <TickerStrip />

      {/* Header */}
      <header className="border-b-2 border-ink bg-bone sticky top-0 z-40">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-volt border-2 border-ink shadow-[3px_3px_0_0_var(--ink)] w-9 h-9 flex items-center justify-center group-hover:bg-ink transition-colors">
              <Zap className="w-4.5 h-4.5 text-acid" fill="currentColor" />
            </div>
            <div className="leading-none">
              <div className="np-display text-sm sm:text-base">Aether</div>
              <div className="np-mono text-[9px] font-bold uppercase tracking-[0.25em]">Sweepstakes</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="order-3 w-full lg:order-2 lg:w-auto flex flex-wrap items-center gap-1.5">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`np-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 border-2 transition-colors ${
                    isActive
                      ? "bg-ink text-acid border-ink"
                      : "border-transparent hover:border-ink hover:bg-paper"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Wallet */}
          <div className="order-2 lg:order-3 flex items-center gap-2">
            {connectedAddress ? (
              <div className="flex items-center gap-0 border-2 border-ink bg-paper shadow-[3px_3px_0_0_var(--ink)]">
                <div className="px-3 py-1.5 text-right leading-tight">
                  <div className="np-mono text-[11px] font-bold">
                    {xlmBalance ? parseFloat(xlmBalance).toFixed(2) : "0.00"} XLM
                  </div>
                  <div className="np-mono text-[9px] opacity-60">
                    {connectedAddress.slice(0, 5)}…{connectedAddress.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={terminateConnection}
                  className="np-mono text-[10px] font-bold uppercase bg-ink text-paper px-2.5 self-stretch hover:bg-alarm transition-colors"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={establishConnection}
                className="np-btn np-btn-volt text-[11px] px-4 py-2 flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-paper mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="np-display text-lg mb-2">Aether Sweepstakes</div>
            <p className="text-xs leading-relaxed text-ink-soft max-w-xs">
              Timed prize cycles with ledger-derived random draws, running entirely
              on Stellar Soroban smart contracts. Testnet demonstration — every
              lumen here is valueless mock XLM.
            </p>
          </div>
          <div>
            <div className="np-label mb-3">Protocol</div>
            <ul className="flex flex-col gap-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="np-mono text-[11px] font-bold uppercase tracking-wider hover:text-volt transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="np-label mb-3">On-Chain (Testnet)</div>
            <ul className="flex flex-col gap-2">
              {[
                { name: "Aether Pool", id: AETHER_POOL_ID },
                { name: "Sweep Coupon", id: SWEEP_COUPON_ID },
                { name: "Commission Vault", id: COMMISSION_VAULT_ID },
              ].map((c) => (
                <li key={c.id}>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="np-mono text-[11px] font-bold uppercase tracking-wider hover:text-volt transition-colors inline-flex items-center gap-1"
                  >
                    {c.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t-2 border-ink bg-ink text-bone">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="np-mono text-[10px] uppercase tracking-widest">
              © 2026 — Built on Stellar Soroban
            </span>
            <span className="np-mono text-[10px] uppercase tracking-widest text-acid">
              Static export · Level 3 submission
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
