"use client";

import Link from "next/link";
import { useWallet } from "../context/WalletContext";
import { Clock, Ticket, ArrowRight, HelpCircle, Trophy, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { roundInfo, currentRoundId } = useWallet();
  const [timeLeft, setTimeLeft] = useState("");
  const [tickerVal, setTickerVal] = useState(0);

  // Parse pot value from roundInfo
  const currentPotStr = roundInfo.pot ? (Number(roundInfo.pot) / 10_000_000).toFixed(2) : "0.00";
  const currentPot = parseFloat(currentPotStr);

  // Smooth ticket buying counter ticker effect
  useEffect(() => {
    let start = 0;
    const end = currentPot;
    if (end === 0) {
      setTickerVal(0);
      return;
    }
    const totalDuration = 800; // ms
    const stepTime = 16; // ~60fps
    const steps = totalDuration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setTickerVal(end);
        clearInterval(timer);
      } else {
        setTickerVal(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [currentPot]);

  // Countdown timer logic
  useEffect(() => {
    if (roundInfo.close_time === 0 || roundInfo.status !== 1) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = roundInfo.close_time - now;

      if (difference <= 0) {
        setTimeLeft("00:00 - Round Ended");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(difference / 60);
        const seconds = difference % 60;
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo.close_time, roundInfo.status]);

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full py-6 animate-fade-in">
      
      {/* Testnet Disclaimer */}
      <div className="bg-[#FFF8EE] border border-[#FEEBD0] text-[#E75A3B] px-5 py-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
        <ShieldAlert className="w-5.5 h-5.5 mt-0.5 flex-shrink-0 text-[#E75A3B]" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">Testnet Protocol Disclaimer</h4>
          <p className="text-[11px] text-[#6E6C64] mt-1 leading-relaxed">
            This application is a technical submission running entirely on the Stellar Soroban testnet network. No real funds, currency, or capital are at stake. All transactions utilize valueless, testnet-minted mock XLM.
          </p>
        </div>
      </div>

      {/* Centerpiece Hero section */}
      <div className="bg-white border border-[#EBE9E1] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-sm flex flex-col items-center">
        
        {/* Glow decorative */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#E75A3B]/5 blur-3xl rounded-full"></div>

        <span className="text-[10px] uppercase font-bold tracking-widest text-[#6E6C64] bg-[#FAF9F5] border border-[#EBE9E1] px-3.5 py-1.5 rounded-full mb-6 relative">
          Round #{roundInfo.round_id || currentRoundId || "1"} Active Pool
        </span>

        <h2 className="text-4xl sm:text-5xl font-black text-[#1C1B18] tracking-tight max-w-xl leading-tight">
          Timed Decentralized Prize Pool Jackpots
        </h2>
        
        <p className="text-sm text-[#6E6C64] mt-3 max-w-md leading-relaxed">
          Buy tickets into the shared prize pool. A ledger-derived random draw settles the round, sending the jackpot straight to the winner.
        </p>

        {/* Ticket Stub Pot Counter Centerpiece */}
        <div className="my-10 bg-[#FAF8F2] border border-[#E6E3D8] rounded-2xl relative p-6 sm:p-8 flex flex-col items-center min-w-[300px] overflow-hidden">
          {/* Ticket side indents */}
          <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-cream border-r border-[#E6E3D8] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-cream border-l border-[#E6E3D8] rounded-full -translate-y-1/2"></div>
          
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#6E6C64] mb-2">
            Current Round Jackpot
          </span>
          
          {/* Oversized tabular numeric text */}
          <div className="text-5xl sm:text-6xl font-mono font-black text-coral flex items-baseline gap-1.5 font-tabular select-all">
            {tickerVal.toFixed(2)}
            <span className="text-lg font-bold text-charcoal">XLM</span>
          </div>

          {/* Perforated divider dashed line */}
          <div className="w-full border-t-2 border-dashed border-[#E6E3D8] my-4"></div>
          
          <div className="text-[9px] uppercase tracking-widest text-[#6E6C64] font-bold">
            Verifiable Ledger Pool
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-sm mb-10 border-b border-[#FAF9F5] pb-8">
          <div className="border-r border-[#EBE9E1]/60 pr-4">
            <span className="text-[9px] uppercase font-semibold text-[#6E6C64] tracking-wider block mb-1">
              Tickets Sold
            </span>
            <div className="text-lg font-extrabold text-[#1C1B18]">
              {roundInfo.ticket_count || 0} Tickets
            </div>
          </div>
          <div className="pl-4">
            <span className="text-[9px] uppercase font-semibold text-[#6E6C64] tracking-wider block mb-1">
              Closes in
            </span>
            <div className="text-lg font-extrabold text-[#1C1B18] flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-[#E75A3B]" />
              {timeLeft || "Closed"}
            </div>
          </div>
        </div>

        {/* Enter Round CTA */}
        <Link
          href="/play"
          className="bg-[#1C1B18] hover:bg-[#E75A3B] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-sm flex items-center gap-2 group text-sm"
        >
          Enter Round & Buy Tickets
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Latest Winner Banner */}
      {roundInfo.status === 2 && roundInfo.winner && (
        <div className="bg-[#ECF7F0] border border-[#CDEBD8] px-6 py-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="bg-[#378E56]/10 p-2 rounded-xl text-[#378E56]">
              <Trophy className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider">Latest Winner Selected!</h4>
              <p className="text-[11px] text-[#6E6C64] mt-0.5">
                Winner: <span className="font-mono text-[#1C1B18] font-bold">{roundInfo.winner.slice(0, 10)}...{roundInfo.winner.slice(-6)}</span>
              </p>
            </div>
          </div>
          <Link
            href="/winners"
            className="text-xs font-bold text-[#378E56] hover:underline flex items-center gap-1"
          >
            Winners Feed
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3-step works strip */}
      <div className="border-t border-[#EBE9E1] pt-10">
        <h3 className="text-xs uppercase font-black text-[#1C1B18] tracking-widest text-center mb-8">
          The 3-Step Flow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#EBE9E1] p-6 rounded-2xl relative shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-black text-xs mb-4">
              01
            </div>
            <h4 className="text-sm font-bold text-[#1C1B18] mb-1">Buy Ticket Entries</h4>
            <p className="text-xs text-[#6E6C64] leading-relaxed">
              Mint a Ticket Token (mint restricted to the coordinator contract) for 1 XLM. Every entry adds to the round pot.
            </p>
          </div>

          <div className="bg-white border border-[#EBE9E1] p-6 rounded-2xl relative shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-black text-xs mb-4">
              02
            </div>
            <h4 className="text-sm font-bold text-[#1C1B18] mb-1">Wait for Countdown</h4>
            <p className="text-xs text-[#6E6C64] leading-relaxed">
              Each round runs for a fixed timed window. No purchases can be made once the timer expires.
            </p>
          </div>

          <div className="bg-white border border-[#EBE9E1] p-6 rounded-2xl relative shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-black text-xs mb-4">
              03
            </div>
            <h4 className="text-sm font-bold text-[#1C1B18] mb-1">On-Chain Settlement</h4>
            <p className="text-xs text-[#6E6C64] leading-relaxed">
              Trigger the random draw. The winner receives 95% of the pot, and the remaining 5% goes to the treasury vault.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
