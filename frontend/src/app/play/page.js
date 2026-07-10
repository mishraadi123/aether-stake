"use client";

import { useState, useEffect } from "react";
import { useAetherWallet } from "../../modules/wallet/WalletProvider";
import {
  constructBuyTicketTx,
  constructApproveTx,
  constructSettleRoundTx,
  constructOpenRoundTx,
  convertStroopsToXlm,
  convertXlmToStroops
} from "../../core/stellar/client";
import { Ticket, Wallet, Clock, CheckCircle2, AlertTriangle, Coins, Settings, Minus, Plus } from "lucide-react";

export default function Play() {
  const {
    connectedAddress,
    xlmBalance,
    approvedSpendLimit,
    userAllocatedCoupons,
    cycleDetails,
    administratorAddress,
    isProcessing,
    processError,
    processSuccess,
    setProcessError,
    setProcessSuccess,
    establishConnection,
    signAndSubmitTx,
    syncStateData
  } = useAetherWallet();

  const [couponQty, setCouponQty] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [openDuration, setOpenDuration] = useState(60);

  // Countdown timer logic
  useEffect(() => {
    if (cycleDetails.close_time === 0 || cycleDetails.status !== 1) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = cycleDetails.close_time - now;

      if (difference <= 0) {
        setTimeLeft("00:00 - Closed");
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
  }, [cycleDetails.close_time, cycleDetails.status]);

  const pricePerCoupon = cycleDetails.ticket_price ? BigInt(cycleDetails.ticket_price) : 0n;
  const totalCostStroops = pricePerCoupon * BigInt(couponQty);

  // Buy Ticket action
  const handleBuyCoupons = async () => {
    setProcessError("");
    setProcessSuccess("");

    if (!connectedAddress) {
      setProcessError("Please connect your wallet first!");
      return;
    }

    if (Math.floor(Date.now() / 1000) >= cycleDetails.close_time) {
      setProcessError("The round timer has expired — no more coupons can be acquired. Settle the cycle to draw the winner.");
      return;
    }

    const userBalanceStroops = convertXlmToStroops(parseFloat(xlmBalance));
    if (userBalanceStroops < totalCostStroops) {
      setProcessError(`Insufficient XLM balance! You need at least ${convertStroopsToXlm(totalCostStroops)} XLM, but you only have ${xlmBalance} XLM.`);
      return;
    }

    // Determine if allowance is sufficient
    const currentAllowance = BigInt(approvedSpendLimit);
    if (currentAllowance < totalCostStroops) {
      // Need to approve first
      await signAndSubmitTx(
        () => constructApproveTx(connectedAddress, totalCostStroops),
        async () => {
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
    for (let i = 0; i < couponQty; i++) {
      if (Math.floor(Date.now() / 1000) >= cycleDetails.close_time) {
        setProcessError(`Cycle closed after ${i} of ${couponQty} coupons — no more entries allowed. Settle the cycle to draw the winner.`);
        return;
      }
      const ok = await signAndSubmitTx(
        () => constructBuyTicketTx(connectedAddress, cycleDetails.round_id),
        () => {
          setProcessSuccess(`Successfully acquired coupon #${i + 1} of ${couponQty}!`);
        },
        `Acquire Coupon ${i + 1}/${couponQty}`
      );
      if (!ok) return;
      if (couponQty > 1 && i < couponQty - 1) {
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  };

  const handleSettle = async () => {
    await signAndSubmitTx(
      () => constructSettleRoundTx(connectedAddress, cycleDetails.round_id),
      () => {
        setProcessSuccess("Draw resolved and winner selected successfully!");
      },
      "Draw Winner"
    );
  };

  const handleOpenRound = async () => {
    if (cycleDetails.status === 1 && !isExpired) {
      setProcessError("A sweepstakes cycle is already active! Settle it first before opening a new cycle.");
      return;
    }
    await signAndSubmitTx(
      () => constructOpenRoundTx(connectedAddress, openDuration),
      () => {
        setProcessSuccess(`Successfully opened Cycle #${cycleDetails.round_id + 1}!`);
      },
      "Begin Cycle"
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-in">

      {/* Page heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="np-display text-2xl sm:text-3xl">Enter the draw</h1>
          <p className="np-mono text-[11px] uppercase tracking-wider text-ink-soft mt-1.5">
            Acquire coupons → wait for zero → anyone settles
          </p>
        </div>
        <span className="np-chip np-chip-ink">Cycle #{cycleDetails.round_id || "—"}</span>
      </div>

      {/* Dynamic Alerts */}
      {processError && (
        <div className="np-card-flat border-alarm bg-paper p-4 flex items-start gap-3 shadow-[5px_5px_0_0_var(--alarm)]" role="alert">
          <AlertTriangle className="w-5 h-5 text-alarm flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="np-mono text-[11px] font-bold uppercase tracking-widest text-alarm">Transaction Refused</h4>
            <p className="text-xs mt-1 leading-relaxed">{processError}</p>
          </div>
        </div>
      )}

      {processSuccess && (
        <div className="np-card-flat border-mint bg-paper p-4 flex items-start gap-3 shadow-[5px_5px_0_0_var(--mint)]" role="status">
          <CheckCircle2 className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="np-mono text-[11px] font-bold uppercase tracking-widest text-mint">Operation Complete</h4>
            <p className="text-xs mt-1 leading-relaxed">{processSuccess}</p>
          </div>
        </div>
      )}

      {/* Connection Gate */}
      {!connectedAddress ? (
        <div className="np-card p-8 sm:p-14 text-center flex flex-col items-center gap-6">
          <div className="bg-volt border-2 border-ink shadow-[4px_4px_0_0_var(--ink)] w-14 h-14 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-acid" />
          </div>
          <div>
            <h3 className="np-display text-lg">Wallet required</h3>
            <p className="text-xs text-ink-soft mt-2 max-w-sm mx-auto leading-relaxed">
              Connect Freighter (or any kit-supported wallet) to check your testnet
              XLM balance, approve the contract spend, and mint entry coupons.
            </p>
          </div>
          <button
            onClick={establishConnection}
            className="np-btn np-btn-volt text-xs px-8 py-3.5 flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main Action Interface */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="np-card p-0 overflow-hidden">
              <div className="bg-ink text-bone px-5 py-3 border-b-2 border-ink flex justify-between items-center">
                <span className="np-mono text-[11px] font-bold uppercase tracking-[0.2em]">
                  Acquire Entry Coupons
                </span>
                <Ticket className="w-4 h-4 text-acid" />
              </div>

              <div className="p-5 sm:p-7">
                {cycleDetails.status === 0 && cycleDetails.round_id > 0 ? (
                  <div className="np-stripes border-2 border-ink p-8 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                    <h4 className="np-display text-sm">Cycle voided</h4>
                    <p className="text-xs text-ink-soft mt-2">
                      This cycle closed with zero entry coupons. Waiting for the administrator to open the next one.
                    </p>
                  </div>
                ) : cycleDetails.status === 2 ? (
                  <div className="border-2 border-mint bg-paper p-8 text-center shadow-[4px_4px_0_0_var(--mint)]">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-mint" />
                    <h4 className="np-display text-sm">Cycle resolved</h4>
                    <p className="text-xs text-ink-soft mt-2">
                      The draw concluded and payouts were dispersed atomically. Check the winner on the Winners page.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Quantity Selector */}
                    <div>
                      <label className="np-label block mb-2">Coupon Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCouponQty(Math.max(1, couponQty - 1))}
                          className="np-btn np-btn-ghost w-11 h-11 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="np-mono font-tabular w-16 h-11 border-2 border-ink bg-acid flex items-center justify-center font-bold text-lg">
                          {couponQty}
                        </div>
                        <button
                          onClick={() => setCouponQty(Math.min(5, couponQty + 1))}
                          className="np-btn np-btn-ghost w-11 h-11 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="np-mono text-[10px] uppercase text-ink-soft ml-1">
                          Max 5 / batch
                        </span>
                      </div>
                    </div>

                    {/* Summary cost */}
                    <div className="border-2 border-ink bg-bone p-4 flex justify-between items-center">
                      <div>
                        <div className="np-label mb-1">Total Cost</div>
                        <div className="np-mono font-bold text-sm">
                          {couponQty} × {convertStroopsToXlm(pricePerCoupon)} XLM
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="np-label mb-1">Stroops</div>
                        <div className="np-mono font-tabular font-bold text-sm text-volt">
                          {totalCostStroops.toString()}
                        </div>
                      </div>
                    </div>

                    {/* Buy Button */}
                    {cycleDetails.status === 1 && !isExpired && (
                      <button
                        onClick={handleBuyCoupons}
                        disabled={isProcessing}
                        className="np-btn np-btn-volt w-full py-4 text-xs flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-4 h-4" />
                        {isProcessing ? "Processing ledger…" : `Acquire coupons (${convertStroopsToXlm(totalCostStroops)} XLM)`}
                      </button>
                    )}

                    {/* Settle Action */}
                    {cycleDetails.status === 1 && isExpired && (
                      <div className="border-2 border-ink bg-acid np-stripes p-5 flex flex-col gap-4">
                        <div className="flex gap-2.5">
                          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="np-display text-xs">Cycle expired — draw ready</h4>
                            <p className="text-[11px] mt-1 leading-relaxed">
                              The countdown hit zero, so coupon minting is closed. Anyone may
                              trigger the draw: the contract picks the winner and disperses funds.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleSettle}
                          disabled={isProcessing}
                          className="np-btn np-btn-ink w-full py-3.5 text-xs flex items-center justify-center gap-2"
                        >
                          <Coins className="w-4 h-4" />
                          {isProcessing ? "Resolving winner…" : "Settle cycle & draw winner"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Info Column */}
          <div className="flex flex-col gap-6">
            {/* Pool Status Card */}
            <div className="np-card-flat p-5 flex flex-col gap-3.5">
              <h3 className="np-label border-b-2 border-ink pb-2">Pool Status</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">Jackpot</span>
                <span className="np-mono font-tabular font-bold text-volt">
                  {convertStroopsToXlm(BigInt(cycleDetails.pot))} XLM
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">Coupons issued</span>
                <span className="np-mono font-tabular font-bold">{cycleDetails.ticket_count}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">Time remaining</span>
                <span className="np-mono font-tabular font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-volt" />
                  {timeLeft || "Closed"}
                </span>
              </div>
            </div>

            {/* User Stats Card */}
            <div className="np-card-flat p-5 flex flex-col gap-3.5">
              <h3 className="np-label border-b-2 border-ink pb-2">Your Position</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">Your coupons</span>
                <span className="np-mono font-tabular font-bold flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-volt" />
                  {userAllocatedCoupons}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">Win probability</span>
                <span className="np-mono font-tabular font-bold">
                  {cycleDetails.ticket_count > 0 ? ((userAllocatedCoupons / cycleDetails.ticket_count) * 100).toFixed(0) : "0"}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-soft">XLM balance</span>
                <span className="np-mono font-tabular font-bold">{parseFloat(xlmBalance).toFixed(2)}</span>
              </div>
            </div>

            {/* Admin Panel Card */}
            {connectedAddress && administratorAddress && connectedAddress === administratorAddress && (
              <div className="np-card p-0 overflow-hidden">
                <div className="bg-volt text-paper px-4 py-2.5 border-b-2 border-ink flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="np-mono text-[10px] font-bold uppercase tracking-widest">
                    Administrator
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <label className="np-label block mb-1.5">Cycle duration (seconds)</label>
                    <input
                      type="number"
                      value={openDuration}
                      onChange={(e) => setOpenDuration(Math.max(10, parseInt(e.target.value) || 10))}
                      className="np-input w-full text-xs"
                    />
                  </div>
                  <button
                    onClick={handleOpenRound}
                    disabled={isProcessing || (cycleDetails.status === 1 && !isExpired)}
                    className="np-btn np-btn-ink w-full py-2.5 text-[11px]"
                  >
                    Open New Cycle
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
