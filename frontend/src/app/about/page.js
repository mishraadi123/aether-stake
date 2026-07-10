"use client";

import { AETHER_POOL_ID, SWEEP_COUPON_ID, COMMISSION_VAULT_ID, XLM_SAC_ID } from "../../core/stellar/client";
import { useAetherWallet } from "../../modules/wallet/WalletProvider";
import { ExternalLink, Layers, Cpu, ShieldCheck, Globe } from "lucide-react";

const CONTRACTS = [
  { name: "Aether Pool (Coordinator)", address: AETHER_POOL_ID },
  { name: "Sweep Coupon Token", address: SWEEP_COUPON_ID },
  { name: "Commission Vault", address: COMMISSION_VAULT_ID },
  { name: "Native XLM Wrapper", address: XLM_SAC_ID },
];

export default function About() {
  const { administratorAddress } = useAetherWallet();

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="np-display text-2xl sm:text-3xl">About</h1>
        <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
          Architecture · stack · on-chain registry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Purpose */}
        <div className="md:col-span-2 np-card-flat p-6 flex flex-col gap-4">
          <h3 className="np-label border-b-2 border-ink pb-2">Project Mandate</h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Aether Sweepstakes is a decentralized prize-cycle application built for
            the <strong className="text-ink">Stellar Soroban Development Challenge (Level 3)</strong>.
            It demonstrates multi-contract orchestration, secure inter-contract
            invocations, real-time client polling of contract events and state,
            atomic settlement, automated CI checks, and mobile-first responsiveness.
          </p>

          <h3 className="np-label border-b-2 border-ink pb-2 mt-2">Technical Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { icon: Cpu, title: "Soroban Contracts", detail: "Rust · Soroban SDK 26" },
              { icon: Layers, title: "Frontend", detail: "Next.js App Router · static export" },
              { icon: Globe, title: "Wallets", detail: "Stellar Wallets Kit (Freighter +)" },
              { icon: ShieldCheck, title: "CI/CD", detail: "GitHub Actions · tests + build" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 border-2 border-ink bg-bone p-3">
                <item.icon className="w-4 h-4 text-volt flex-shrink-0" />
                <div>
                  <span className="np-mono font-bold text-ink block text-[11px] uppercase">{item.title}</span>
                  <span className="text-ink-soft text-[11px]">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment & operator */}
        <div className="np-card-flat p-6 flex flex-col gap-4">
          <h3 className="np-label border-b-2 border-ink pb-2">Deployment</h3>
          <div className="text-xs flex flex-col gap-3">
            <div>
              <div className="np-label mb-1">Network</div>
              <span className="np-chip np-chip-volt">Stellar Testnet</span>
            </div>
            <div>
              <div className="np-label mb-1">Administrator</div>
              {administratorAddress ? (
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${administratorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="np-mono text-[10px] font-bold break-all hover:text-volt transition-colors"
                >
                  {administratorAddress}
                </a>
              ) : (
                <span className="np-mono text-[10px] text-ink-soft">loading from contract…</span>
              )}
            </div>
            <div>
              <div className="np-label mb-1">Maintainer</div>
              <a
                href="https://github.com/shaurya-garg-82"
                target="_blank"
                rel="noopener noreferrer"
                className="np-mono text-[11px] font-bold hover:text-volt transition-colors inline-flex items-center gap-1"
              >
                @shaurya-garg-82
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Addresses table */}
      <div className="np-card p-0 overflow-hidden">
        <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink">
          <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
            On-Chain Registry
          </span>
        </div>
        <div>
          {CONTRACTS.map((contract, i) => (
            <div
              key={contract.address}
              className={`p-4 sm:px-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${i < CONTRACTS.length - 1 ? "border-b-2 border-ink" : ""}`}
            >
              <div className="min-w-0">
                <span className="np-mono text-[11px] font-bold uppercase block">{contract.name}</span>
                <span className="np-mono text-[10px] text-ink-soft select-all break-all">{contract.address}</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="np-btn np-btn-ghost text-[10px] px-3 py-1.5 inline-flex items-center gap-1.5 flex-shrink-0"
              >
                Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
