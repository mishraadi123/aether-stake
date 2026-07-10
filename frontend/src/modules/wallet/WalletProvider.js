"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  queryActiveRoundSequence,
  queryCycleDetails,
  queryUserEntryCount,
  queryXlmBalance,
  queryAllowance,
  queryAccumulatedCommissions,
  broadcastTransaction,
  queryAdministrator
} from "../../core/stellar/client";

const AetherWalletContext = createContext(null);

export function AetherWalletProvider({ children }) {
  const [walletKit, setWalletKit] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [xlmBalance, setXlmBalance] = useState("0");
  const [approvedSpendLimit, setApprovedSpendLimit] = useState("0");
  const [userAllocatedCoupons, setUserAllocatedCoupons] = useState(0);

  const [activeCycleSequence, setActiveCycleSequence] = useState(0);
  const [cycleDetails, setCycleDetails] = useState({
    round_id: 0,
    status: 0,
    ticket_price: "0",
    ticket_count: 0,
    pot: "0",
    close_time: 0,
    winner: null
  });
  const [accruedCommissions, setAccruedCommissions] = useState("0");
  const [administratorAddress, setAdministratorAddress] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  const [processSuccess, setProcessSuccess] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  const recordLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [{ time, message }, ...prev].slice(0, 15));
  };

  // Initialize Stellar Wallets Kit on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const [{ StellarWalletsKit }, { defaultModules }, { Networks }] = await Promise.all([
          import("@creit.tech/stellar-wallets-kit/sdk"),
          import("@creit.tech/stellar-wallets-kit/modules/utils"),
          import("@creit.tech/stellar-wallets-kit/types"),
        ]);

        StellarWalletsKit.init({
          network: Networks.TESTNET,
          modules: defaultModules(),
        });
        if (!cancelled) {
          setWalletKit(() => StellarWalletsKit);
          recordLog("Aether Wallet Kit connected.");
        }
      } catch (err) {
        console.warn("Error loading wallets kit", err);
        if (!cancelled) setProcessError("Failed to initialize wallet kit.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh all state variables.
  const syncStateData = async (silent = false) => {
    if (!silent) setIsProcessing(true);
    try {
      const activeSeq = await queryActiveRoundSequence();
      setActiveCycleSequence(activeSeq);

      if (activeSeq > 0) {
        const details = await queryCycleDetails(activeSeq);
        setCycleDetails(details);

        if (connectedAddress) {
          const tickets = await queryUserEntryCount(activeSeq, connectedAddress);
          setUserAllocatedCoupons(tickets);
        }
      }

      if (connectedAddress) {
        const bal = await queryXlmBalance(connectedAddress);
        setXlmBalance(bal);

        const limit = await queryAllowance(connectedAddress);
        setApprovedSpendLimit(limit);
      }

      const commissions = await queryAccumulatedCommissions();
      setAccruedCommissions(commissions);

      if (!administratorAddress) {
        const admin = await queryAdministrator();
        setAdministratorAddress(admin || "");
      }
    } catch (err) {
      console.warn("RPC Sync issue:", err);
      if (!silent) setProcessError("Failed to query Soroban RPC.");
    } finally {
      if (!silent) setIsProcessing(false);
    }
  };

  // Refresh immediately whenever the connected account changes
  useEffect(() => {
    syncStateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress]);

  // Poll on-chain round state so the pot, ticket count and status update in near-real-time
  useEffect(() => {
    const interval = setInterval(() => {
      syncStateData(true);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress]);

  // Connect Wallet — opens the kit's auth modal and resolves with the address
  const establishConnection = async () => {
    if (!walletKit) return;
    setProcessError("");
    setIsProcessing(true);
    try {
      const { address } = await walletKit.authModal({});
      setConnectedAddress(address);
      recordLog(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      console.warn("Connection issue/cancellation:", err);
      setProcessError(err?.message || "Wallet connection cancelled.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Disconnect Wallet
  const terminateConnection = async () => {
    try {
      await walletKit?.disconnect();
    } catch (err) {
      console.warn("Disconnection issue:", err);
    }
    setConnectedAddress("");
    setXlmBalance("0");
    setApprovedSpendLimit("0");
    setUserAllocatedCoupons(0);
    recordLog("Wallet connection closed.");
  };

  // Map raw contract traps (simulation/execution panics) to human messages.
  const mapTrapError = (actionName, raw) => {
    if (!raw) return null;
    if (/user (declined|denied|rejected)|declined access|denied by the user|rejected by the user|cancel(l)?ed by (the )?user/i.test(raw))
      return `Signature request rejected — you dismissed the wallet prompt, so "${actionName}" was not broadcast. No funds moved.`;
    if (!/InvalidAction|UnreachableCodeReached|trapped/i.test(raw)) return null;
    if (actionName.startsWith("Acquire Coupon"))
      return "The active cycle has concluded — entry coupons can no longer be acquired. Settle the pool to draw the winner.";
    if (actionName === "Draw Winner")
      return "The cycle details cannot be resolved yet (timer still active), or it was already settled.";
    if (actionName === "Begin Cycle")
      return "A sweepstakes round is currently active on-chain — resolve it before beginning a new cycle.";
    return "The pool contract rejected the operation. On-chain state has been refreshed.";
  };

  // Sign and submit transactions. Returns true on success, false on failure
  const signAndSubmitTx = async (txBuilderFn, successCallback, actionName) => {
    setProcessError("");
    setProcessSuccess("");
    setIsProcessing(true);
    try {
      if (!connectedAddress) throw new Error("Wallet not connected");

      recordLog(`Constructing transaction: ${actionName}...`);
      const tx = await txBuilderFn();
      const xdrString = tx.toXDR();

      recordLog("Acquiring digital signature...");
      const { signedTxXdr } = await walletKit.signTransaction(xdrString, { address: connectedAddress });

      recordLog("Broadcasting transaction to Soroban RPC...");
      const result = await broadcastTransaction(signedTxXdr);

      if (result.success) {
        setProcessSuccess(`${actionName} confirmed!`);
        recordLog(`${actionName} completed. Tx Hash: ${result.hash.slice(0, 8)}...`);
        if (successCallback) await successCallback();
        await syncStateData();
      }
      return true;
    } catch (err) {
      console.warn("Tx Execution issue:", err);
      const friendly = mapTrapError(actionName, err?.message);
      setProcessError(friendly || err.message || `${actionName} failed.`);
      recordLog(`Error during ${actionName}: ${err.message || "Failed"}`);
      await syncStateData(true);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AetherWalletContext.Provider
      value={{
        walletKit,
        connectedAddress,
        xlmBalance,
        approvedSpendLimit,
        userAllocatedCoupons,
        activeCycleSequence,
        cycleDetails,
        accruedCommissions,
        administratorAddress,
        isProcessing,
        processError,
        processSuccess,
        auditLogs,
        setProcessError,
        setProcessSuccess,
        recordLog,
        establishConnection,
        terminateConnection,
        syncStateData,
        signAndSubmitTx
      }}
    >
      {children}
    </AetherWalletContext.Provider>
  );
}

export function useAetherWallet() {
  const context = useContext(AetherWalletContext);
  if (!context) {
    throw new Error("useAetherWallet must be used within an AetherWalletProvider");
  }
  return context;
}
