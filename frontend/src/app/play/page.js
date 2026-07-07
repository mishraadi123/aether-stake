"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { buildBuyTicketTx, buildApproveTx, buildSettleRoundTx, buildOpenRoundTx, fromStroops, toStroops } from "../../utils/stellar";
import { Ticket, Wallet, Clock, CheckCircle2, AlertTriangle, Coins, ShieldAlert, ArrowRight, ExternalLink, Settings } from "lucide-react";

export default function Play() {
  const {
    pubKey,
    balance,
    allowance,
    userTickets,
    roundInfo,
    adminAddress,
    loading,
    errorMsg,
    successMsg,
    setErrorMsg,
    setSuccessMsg,
    connectWallet,
    executeTransaction,
    refreshData
  } = useWallet();

  const [ticketQty, setTicketQty] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [openDuration, setOpenDuration] = useState(60);

  // Countdown timer logic
  useEffect(() => {
    if (roundInfo.close_time === 0 || roundInfo.status !== 1) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = roundInfo.close_time - now;

      if (difference <= 0) {
        setTimeLeft("00:00 - Ended");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(difference / 60);
        const seconds = difference % 60;
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo.close_time, roundInfo.status]);

  const pricePerTicket = roundInfo.ticket_price ? BigInt(roundInfo.ticket_price) : 0n;
  const totalCostStroops = pricePerTicket * BigInt(ticketQty);

  // Buy Ticket action
  const handleBuyTickets = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!pubKey) {
      setErrorMsg("Please connect your wallet first!");
      return;
    }

    if (Math.floor(Date.now() / 1000) >= roundInfo.close_time) {
      setErrorMsg("The round timer has expired — no more tickets can be purchased. Settle the round to draw the winner.");
      return;
    }

    const userBalanceStroops = toStroops(parseFloat(balance));
    if (userBalanceStroops < totalCostStroops) {
      setErrorMsg(`Insufficient XLM balance! You need at least ${fromStroops(totalCostStroops)} XLM, but you only have ${balance} XLM.`);
      return;
    }

    // Determine if allowance is sufficient
    const currentAllowance = BigInt(allowance);
    if (currentAllowance < totalCostStroops) {
      // Need to approve first
      await executeTransaction(
        () => buildApproveTx(pubKey, totalCostStroops),
        async () => {
          // Wait 2 seconds for ledger state propagation before buying
          await new Promise((r) => setTimeout(r, 2000));
          await buyStep();
        },
        "Approve XLM Spend"
      );
    } else {
      await buyStep();
    }
  };

  const buyStep = async () => {
    // Loop to buy the requested number of tickets
    for (let i = 0; i < ticketQty; i++) {
      // The timer may run out mid-batch — re-check before each purchase
      if (Math.floor(Date.now() / 1000) >= roundInfo.close_time) {
        setErrorMsg(`Round closed after ${i} of ${ticketQty} tickets — no more entries allowed. Settle the round to draw the winner.`);
        return;
      }
      const ok = await executeTransaction(
        () => buildBuyTicketTx(pubKey, roundInfo.round_id),
        () => {
          setSuccessMsg(`Successfully bought ticket #${i + 1} of ${ticketQty}!`);
        },
        `Buy Ticket ${i + 1}/${ticketQty}`
      );
      // Stop the batch on the first failure — the error is already displayed
      if (!ok) return;
      if (ticketQty > 1 && i < ticketQty - 1) {
        // Wait between multi-mints to prevent transaction submission sequence overlap
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  };

  const handleSettle = async () => {
    await executeTransaction(
      () => buildSettleRoundTx(pubKey, roundInfo.round_id),
      () => {
        setSuccessMsg("Round settled successfully!");
      },
      "Settle Round"
    );
  };

  const handleOpenRound = async () => {
    if (roundInfo.status === 1 && !isExpired) {
      setErrorMsg("A round is already active! Settle it first before opening a new round.");
      return;
    }
    await executeTransaction(
      () => buildOpenRoundTx(pubKey, openDuration),
      () => {
        setSuccessMsg(`Successfully opened Round #${roundInfo.round_id + 1}!`);
      },
      "Open Round"
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      {/* Dynamic Alerts */}
      {errorMsg && (
        <div className="p-4 bg-[#FFF0EE] border border-[#FFD2CC] text-[#D44E30] rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5.5 h-5.5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">Transaction Refused</h4>
            <p className="text-[11px] mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#ECF7F0] border border-[#CDEBD8] text-[#378E56] rounded-2xl flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-5.5 h-5.5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">Success</h4>
            <p className="text-[11px] mt-1 leading-relaxed">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Connection Gate */}
      {!pubKey ? (
        <div className="bg-white border border-[#EBE9E1] rounded-3xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center gap-6">
          <Wallet className="w-12 h-12 text-[#E75A3B] animate-pulse-slow" />
          <div>
            <h3 className="text-xl font-black text-[#1C1B18]">Wallet Connection Required</h3>
            <p className="text-xs text-[#6E6C64] mt-2 max-w-sm mx-auto leading-relaxed">
              Connect your Stellar wallet (Freighter primary) to view your mock XLM balances, approve contract spends, and buy ticket tokens.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="bg-[#1C1B18] hover:bg-[#E75A3B] text-white text-xs font-bold px-8 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Wallet className="w-4.5 h-4.5" />
            Connect Freighter Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Buy Box */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-start border-b border-[#FAF9F5] pb-6 mb-6">
                <div>
                  <h3 className="text-lg font-black text-[#1C1B18]">Enter Active Round</h3>
                  <p className="text-xs text-[#6E6C64] mt-1">
                    Select ticket quantity and submit. Every ticket has an equal draw probability.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#6E6C64] bg-[#FAF9F5] border border-[#EBE9E1] px-2.5 py-1 rounded-md">
                  Round #{roundInfo.round_id || "1"}
                </span>
              </div>

              {roundInfo.status === 0 && roundInfo.round_id > 0 ? (
                <div className="py-8 text-center bg-[#FFF0EE] rounded-2xl border border-[#FFD2CC] p-6 text-[#D44E30]">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="text-sm font-bold">Round Voided</h4>
                  <p className="text-xs mt-1">This round was closed with zero ticket purchases.</p>
                </div>
              ) : roundInfo.status === 2 ? (
                <div className="py-8 text-center bg-[#ECF7F0] rounded-2xl border border-[#CDEBD8] p-6 text-[#378E56]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="text-sm font-bold">Round Settled</h4>
                  <p className="text-xs mt-1">The winner has been drawn and payouts distributed.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Quantity Selector */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6E6C64] block mb-2">
                      Quantity of Tickets
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTicketQty(Math.max(1, ticketQty - 1))}
                        className="w-10 h-10 border border-[#EBE9E1] hover:bg-[#FAF9F5] rounded-xl flex items-center justify-center font-bold text-sm text-[#1C1B18] transition-all"
                      >
                        -
                      </button>
                      <div className="w-16 h-10 border border-[#EBE9E1] bg-[#FAF9F5] rounded-xl flex items-center justify-center font-extrabold text-sm text-[#1C1B18]">
                        {ticketQty}
                      </div>
                      <button
                        onClick={() => setTicketQty(Math.min(5, ticketQty + 1))}
                        className="w-10 h-10 border border-[#EBE9E1] hover:bg-[#FAF9F5] rounded-xl flex items-center justify-center font-bold text-sm text-[#1C1B18] transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-[#6E6C64] ml-2">
                        Max 5 per txn (prevents sequence clashes)
                      </span>
                    </div>
                  </div>

                  {/* Summary cost */}
                  <div className="bg-[#FAF9F5] border border-[#EBE9E1] rounded-2xl p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#6E6C64] block mb-0.5">Total Ticket Cost</span>
                      <span className="font-bold text-[#1C1B18]">
                        {ticketQty} &times; {fromStroops(pricePerTicket)} XLM
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#6E6C64] block mb-0.5">Stroops</span>
                      <span className="font-bold text-[#E75A3B]">{totalCostStroops.toString()}</span>
                    </div>
                  </div>

                  {/* Buy Button */}
                  {roundInfo.status === 1 && !isExpired && (
                    <button
                      onClick={handleBuyTickets}
                      disabled={loading}
                      className="w-full bg-[#1C1B18] hover:bg-[#E75A3B] text-white font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                    >
                      <Ticket className="w-4.5 h-4.5" />
                      {loading ? "Processing..." : `Mint Tickets (${fromStroops(totalCostStroops)} XLM)`}
                    </button>
                  )}

                  {/* Settle Action */}
                  {roundInfo.status === 1 && isExpired && (
                    <div className="bg-[#FFF8EE] border border-[#FEEBD0] p-6 rounded-2xl flex flex-col gap-4">
                      <div className="flex gap-2">
                        <Clock className="w-5 h-5 mt-0.5 text-[#E75A3B] flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider">Round Finished!</h4>
                          <p className="text-[11px] text-[#6E6C64] mt-0.5">
                            The countdown timer has expired. Users can no longer purchase tickets. Click Settle to draw.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSettle}
                        disabled={loading}
                        className="w-full bg-[#E75A3B] hover:bg-[#D44E30] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2"
                      >
                        <Coins className="w-4.5 h-4.5" />
                        {loading ? "Settling..." : "Settle Round & Draw Winner"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Status column */}
          <div className="flex flex-col gap-6">
            
            {/* Round info card */}
            <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
                Pool Status
              </h3>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Active Pot</span>
                <span className="font-extrabold text-[#E75A3B]">{fromStroops(BigInt(roundInfo.pot))} XLM</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Tickets sold</span>
                <span className="font-extrabold text-[#1C1B18]">{roundInfo.ticket_count} sold</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Closes in</span>
                <span className="font-extrabold text-[#1C1B18] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E75A3B]" />
                  {timeLeft || "Closed"}
                </span>
              </div>
            </div>

            {/* User status card */}
            <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
                Your Round Stats
              </h3>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Your Tickets</span>
                <span className="font-extrabold text-[#E75A3B] flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" />
                  {userTickets} tickets
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Win Probability</span>
                <span className="font-extrabold text-[#1C1B18]">
                  {roundInfo.ticket_count > 0 ? ((userTickets / roundInfo.ticket_count) * 100).toFixed(0) : "0"}%
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E6C64]">Wallet balance</span>
                <span className="font-extrabold text-[#1C1B18]">{parseFloat(balance).toFixed(2)} XLM</span>
              </div>
            </div>

            {/* Admin Panel card */}
            {pubKey && adminAddress && pubKey === adminAddress && (
              <div className="bg-white border border-coral/30 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-coral border-b border-coral/10 pb-2 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Admin Panel
                </h3>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#6E6C64] block mb-1">
                      Round Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={openDuration}
                      onChange={(e) => setOpenDuration(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full bg-[#FAF9F5] border border-[#EBE9E1] px-3 py-2 rounded-xl text-xs font-bold text-[#1C1B18] focus:outline-none focus:border-coral"
                    />
                  </div>

                  <button
                    onClick={handleOpenRound}
                    disabled={loading || (roundInfo.status === 1 && !isExpired)}
                    className="w-full bg-coral hover:bg-coral-hover disabled:bg-sand text-white font-bold py-2.5 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1"
                  >
                    Open New Round
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
