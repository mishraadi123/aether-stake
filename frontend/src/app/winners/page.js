"use client";

import { useWallet } from "../../context/WalletContext";
import { fromStroops } from "../../utils/stellar";
import { Trophy, ExternalLink, Award, ShieldCheck } from "lucide-react";

export default function Winners() {
  const { roundInfo } = useWallet();

  const mockWinners = [
    {
      round_id: 1,
      winner: "GAKF7GXDBJS2MMMVFHE4UNEKXJM3BABM3DQCSTF3JKRKN5WZI4GW4TIV",
      amount: 4750000000n, // 475 XLM (payout = 500 pot - 25 fee)
      pot: 5000000000n,
      tx: "f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7",
      timestamp: "2026-07-08T06:55:40Z"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-[#1C1B18]">Winners Feed</h2>
        <p className="text-xs text-[#6E6C64] mt-1">
          Verifiable ledger transactions showing payout distributions to round winners.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Active winner from context if settled */}
        {roundInfo.status === 2 && roundInfo.winner && (
          <div className="bg-[#ECF7F0] border-2 border-[#CDEBD8] rounded-3xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#378E56]/5 rounded-full blur-2xl"></div>
            <div className="flex items-start gap-4">
              <div className="bg-[#378E56] text-white p-3 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#378E56] bg-white border border-[#CDEBD8] px-2 py-0.5 rounded-md mb-2 inline-block">
                  Live Draw Winner
                </span>
                <h3 className="text-lg font-black text-[#1C1B18] mt-1">
                  Round #{roundInfo.round_id} Winner selected
                </h3>
                <div className="mt-3 flex flex-col gap-1.5 text-xs text-[#6E6C64]">
                  <div>
                    Winner Account: <span className="font-mono text-[#1C1B18] font-bold select-all break-all">{roundInfo.winner}</span>
                  </div>
                  <div>
                    Prize Payout: <span className="font-extrabold text-[#378E56]">{fromStroops(BigInt(roundInfo.pot) * 95n / 100n)} XLM</span> (95% jackpot)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mockWinners.map((winner, idx) => (
          <div key={idx} className="bg-white border border-[#E6E3D8] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Ticket side indents */}
            <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-cream border-r border-[#E6E3D8] rounded-full -translate-y-1/2"></div>
            <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-cream border-l border-[#E6E3D8] rounded-full -translate-y-1/2"></div>
            <div className="flex items-center gap-4">
              <div className="bg-[#FAF9F5] border border-[#EBE9E1] text-[#E75A3B] p-3 rounded-2xl">
                <Award className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#1C1B18]">
                  Round #{winner.round_id} Jackpot Payout
                </h4>
                <p className="text-[10px] text-[#6E6C64] mt-0.5">
                  Winner: <span className="font-mono text-[#1C1B18] font-bold">{winner.winner.slice(0, 12)}...{winner.winner.slice(-6)}</span>
                </p>
                <p className="text-[9px] text-[#6E6C64] mt-1">
                  Settled at: {new Date(winner.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-[#FAF9F5] pt-4 sm:pt-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#6E6C64] block">Prize Reward</span>
                <span className="text-lg font-black text-[#E75A3B]">{fromStroops(winner.amount)} XLM</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${winner.tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#E75A3B] hover:underline inline-flex items-center gap-1 bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#EBE9E1] hover:bg-white"
              >
                Verify Tx
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
