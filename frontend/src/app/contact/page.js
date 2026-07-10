"use client";

import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { AETHER_POOL_ID } from "../../core/stellar/client";

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

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="np-display text-2xl sm:text-3xl">Contact</h1>
        <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
          Maintainer channels · no forms, on purpose
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Static notice */}
        <div className="np-card-flat p-6 flex flex-col gap-4">
          <h3 className="np-label border-b-2 border-ink pb-2">Why No Contact Form</h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            This app compiles to pure static assets (<code className="np-mono text-volt">output: &apos;export&apos;</code>)
            served from the edge — there is no backend to receive form submissions.
          </p>
          <div className="border-2 border-ink np-stripes bg-bone p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Rather than ship a dummy form that silently drops your message, we
              list only channels that actually reach the maintainer.
            </p>
          </div>
        </div>

        {/* Channels */}
        <div className="np-card-flat p-6 flex flex-col gap-4">
          <h3 className="np-label border-b-2 border-ink pb-2">Channels</h3>
          <div className="flex flex-col gap-3">
            <a
              href="https://github.com/shaurya-garg-82"
              target="_blank"
              rel="noopener noreferrer"
              className="np-btn np-btn-ghost p-4 flex items-center justify-between normal-case tracking-normal font-normal text-left"
            >
              <div className="flex items-center gap-3">
                <GithubIcon className="w-5 h-5 text-volt" />
                <div className="text-xs">
                  <span className="np-mono font-bold uppercase block">GitHub</span>
                  <span className="text-ink-soft">@shaurya-garg-82 — issues &amp; PRs</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>

            <a
              href={`https://stellar.expert/explorer/testnet/contract/${AETHER_POOL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="np-btn np-btn-ghost p-4 flex items-center justify-between normal-case tracking-normal font-normal text-left"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-volt" />
                <div className="text-xs">
                  <span className="np-mono font-bold uppercase block">On-Chain</span>
                  <span className="text-ink-soft">Audit the protocol directly on Stellar Expert</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
