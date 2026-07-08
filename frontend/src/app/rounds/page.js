"use client";

import { useWallet } from "../../context/WalletContext";
import { fromStroops } from "../../utils/stellar";
import { ExternalLink, Trophy, HelpCircle, ShieldCheck } from "lucide-react";

export default function Rounds() {
  const { roundInfo, currentRoundId } = useWallet();

  const mockRounds = [
    {
      round_id: 1,
      pot: 5000000000n, // 500 XLM
      ticket_count: 5,
      winner: "GAKF7GXDBJS2MMMVFHE4UNEKXJM3BABM3DQCSTF3JKRKN5WZI4GW4TIV",
      settle_tx: "f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7",
      status: 2 // settled
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-[#1C1B18]">Round History & Audits</h2>
        <p className="text-xs text-[#6E6C64] mt-1">
          Complete transparent log of all finished timed rounds. Every settlement draw is verifiable on-chain.
        </p>
      </div>

      <div className="bg-white border border-[#EBE9E1] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#EBE9E1] text-[10px] uppercase font-bold text-[#6E6C64] tracking-wider">
                <th className="py-4 px-6">Round</th>
                <th className="py-4 px-6">Jackpot (XLM)</th>
                <th className="py-4 px-6">Tickets</th>
                <th className="py-4 px-6">Winner Address</th>
                <th className="py-4 px-6">Draw Hash</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#FAF9F5]">
              
              {/* Highlight Active Round from Context */}
              {roundInfo.round_id > 0 && (
                <tr className="bg-[#FFFDF9] font-semibold text-[#1C1B18]">
                  <td className="py-4 px-6 font-bold">
                    #{roundInfo.round_id}
                  </td>
                  <td className="py-4 px-6 text-[#E75A3B] font-extrabold">
                    {fromStroops(BigInt(roundInfo.pot))} XLM
                  </td>
                  <td className="py-4 px-6">
                    {roundInfo.ticket_count} sold
                  </td>
                  <td className="py-4 px-6 font-mono opacity-60">
                    {roundInfo.winner ? `${roundInfo.winner.slice(0, 6)}...${roundInfo.winner.slice(-4)}` : "Pending draw"}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#E75A3B]">
                    --
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold text-white bg-[#378E56] px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  </td>
                </tr>
              )}

              {/* Render Historical Rounds */}
              {mockRounds.map((round) => (
                <tr key={round.round_id} className="text-[#6E6C64] hover:bg-[#FAF9F5]/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#1C1B18]">
                    #{round.round_id}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#1C1B18]">
                    {fromStroops(round.pot)} XLM
                  </td>
                  <td className="py-4 px-6">
                    {round.ticket_count} tickets
                  </td>
                  <td className="py-4 px-6 font-mono text-[#1C1B18]">
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${round.winner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 inline-flex hover:text-[#E75A3B]"
                    >
                      {round.winner.slice(0, 6)}...{round.winner.slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-6 font-mono">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${round.settle_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-[#E75A3B] flex items-center gap-1 inline-flex"
                    >
                      {round.settle_tx.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold bg-[#FAF9F5] border border-[#EBE9E1] px-2 py-0.5 rounded-md text-[#1C1B18]">
                      Settled
                    </span>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
