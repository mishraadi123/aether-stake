"use client";

import { LOTTERY_ID, TICKET_ID, TREASURY_ID, XLM_SAC_ID } from "../../utils/stellar";
import { ExternalLink, Layers, FileCode, Cpu } from "lucide-react";

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function About() {
  const contracts = [
    { name: "Lottery (Coordinator)", address: LOTTERY_ID },
    { name: "Ticket Token", address: TICKET_ID },
    { name: "Treasury Pool", address: TREASURY_ID },
    { name: "Native XLM Wrapper", address: XLM_SAC_ID }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-[#1C1B18]">About Windfall</h2>
        <p className="text-xs text-[#6E6C64] mt-1">
          Technical specifications, project details, and repository deployment credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project Purpose */}
        <div className="md:col-span-2 bg-white border border-[#EBE9E1] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
            Project Purpose
          </h3>
          <p className="text-xs text-[#6E6C64] leading-relaxed">
            Windfall is a decentralized smart contract application built for the **Stellar dApp Challenge Submission Program (Level 3 Tier)**. 
          </p>
          <p className="text-xs text-[#6E6C64] leading-relaxed">
            The target is to demonstrate advanced blockchain development methodologies: multi-contract configurations, cross-contract calls, event logging, clean component architectures, robust wallet handlers, test-driven development, and automated workflows.
          </p>

          <h3 className="text-sm font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2 mt-4">
            Tech Stack Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-[#6E6C64]">
            <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#EBE9E1] p-3 rounded-xl">
              <Cpu className="w-4.5 h-4.5 text-[#E75A3B]" />
              <div>
                <span className="font-bold text-[#1C1B18] block">Soroban Contracts</span>
                <span>Rust & SDK v26</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#EBE9E1] p-3 rounded-xl">
              <Layers className="w-4.5 h-4.5 text-[#E75A3B]" />
              <div>
                <span className="font-bold text-[#1C1B18] block">Frontend Client</span>
                <span>Next.js App Router</span>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub / Repo details */}
        <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
            Source Code
          </h3>
          <p className="text-xs text-[#6E6C64] leading-relaxed">
            The complete source code including contracts, unit tests, and frontend pages is open source on GitHub.
          </p>
          <a
            href="https://github.com/shaurya-garg/windfall"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 bg-[#1C1B18] hover:bg-[#E75A3B] text-white text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <GithubIcon className="w-4.5 h-4.5" />
            GitHub Repository
          </a>
        </div>

      </div>

      {/* Contract Addresses table */}
      <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#1C1B18] mb-4">
          Contract Deployments Registry
        </h3>
        <div className="flex flex-col gap-4">
          {contracts.map((contract, i) => (
            <div key={i} className="bg-[#FAF9F5] border border-[#EBE9E1] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-extrabold text-[#1C1B18]">{contract.name}</span>
                <span className="font-mono text-[10px] text-[#6E6C64] block select-all break-all mt-1">{contract.address}</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#E75A3B] hover:underline inline-flex items-center gap-1.5 flex-shrink-0 bg-white border border-[#EBE9E1] px-3 py-1.5 rounded-lg hover:bg-cream"
              >
                Explorer View
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
