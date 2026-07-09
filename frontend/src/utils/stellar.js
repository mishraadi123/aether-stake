import { Contract, rpc, Horizon, TransactionBuilder, Account, Keypair, Address, xdr } from "@stellar/stellar-sdk";
import { toStroops, fromStroops } from "./format";

// Re-exported for existing importers (`import { toStroops } from "../utils/stellar"`).
export { toStroops, fromStroops };

export const LOTTERY_ID = "CBNZ3QUKPHTXQ45J5TMKHKZPXUH6IA5TGSYL42LZXBCUXZJ5JPM4MHFQ";
export const TICKET_ID = "CA5RC26Z4I5K7Y3BYVKTUTI5IJ2T73YSL4YT4ZIPNFZ344FHZK3G26KW";
export const TREASURY_ID = "CALL5JIM7PHWSYGFRVZ345JQSWQSBCKMWZ5TUIOS2BTPL4OG2HV3I7HA";
export const XLM_SAC_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export function getRpcServer() {
  return new rpc.Server(RPC_URL);
}

export function getHorizonServer() {
  return new Horizon.Server(HORIZON_URL);
}

/**
 * Perform a read-only (simulation) call on a contract
 */
export async function simulateCall(contractId, method, args = []) {
  const server = getRpcServer();
  const contract = new Contract(contractId);
  // Read-only simulations don't require a funded/real source account, so we
  // use a throwaway keypair with sequence 0. The RPC never checks it for reads.
  const sourceAccount = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(simResponse)) {
    return simResponse.result.retval;
  }
  throw new Error(`Simulation failed for ${method}: ${simResponse.error || "unknown error"}`);
}

/**
 * Fetch current round ID
 */
export async function fetchCurrentRoundId() {
  const retval = await simulateCall(LOTTERY_ID, "get_current_round_id");
  // retval is xdr.Val, we parse it
  return retval.u32();
}

/**
 * Fetch round info
 */
export async function fetchRoundInfo(roundId) {
  const retval = await simulateCall(LOTTERY_ID, "get_round", [
    xdr.ScVal.scvU32(roundId),
  ]);
  
  // Parse map representation of RoundInfo
  // Struct RoundInfo { round_id: u32, status: u32, ticket_price: i128, ticket_count: u32, pot: i128, close_time: u64, winner: Option<Address> }
  const map = retval.map();
  
  let round_id = 0;
  let status = 0;
  let ticket_price = "0";
  let ticket_count = 0;
  let pot = "0";
  let close_time = 0;
  let winner = null;

  for (const entry of map) {
    const key = entry.key().sym().toString();
    const val = entry.val();
    if (key === "round_id") round_id = val.u32();
    else if (key === "status") status = val.u32();
    else if (key === "ticket_price") ticket_price = val.i128().lo().toString(); // simplify parsing lo/hi
    else if (key === "ticket_count") ticket_count = val.u32();
    else if (key === "pot") pot = val.i128().lo().toString();
    else if (key === "close_time") close_time = Number(val.u64().toBigInt());
    else if (key === "winner") {
      if (val.switch().value !== xdr.ScValType.scvVoid().value) {
        winner = Address.fromScVal(val).toString();
      }
    }
  }

  return { round_id, status, ticket_price, ticket_count, pot, close_time, winner };
}

/**
 * Fetch user's tickets in a round
 */
export async function fetchUserTickets(roundId, userAddress) {
  try {
    const userScVal = Address.fromString(userAddress).toScVal();
    const retval = await simulateCall(LOTTERY_ID, "get_tickets", [
      xdr.ScVal.scvU32(roundId),
      userScVal,
    ]);
    return retval.u32();
  } catch (e) {
    console.error("error fetching user tickets", e);
    return 0;
  }
}

/**
 * Fetch user's native XLM balance via Horizon
 */
export async function fetchXlmBalance(userAddress) {
  try {
    const horizon = getHorizonServer();
    const account = await horizon.loadAccount(userAddress);
    const balanceObj = account.balances.find((b) => b.asset_type === "native");
    return balanceObj ? balanceObj.balance : "0";
  } catch (e) {
    console.error("error fetching balance", e);
    return "0";
  }
}

/**
 * Fetch current allowance of lottery contract over user's XLM
 */
export async function fetchAllowance(userAddress) {
  try {
    const userScVal = Address.fromString(userAddress).toScVal();
    const spenderScVal = Address.fromString(LOTTERY_ID).toScVal();
    const retval = await simulateCall(XLM_SAC_ID, "allowance", [
      userScVal,
      spenderScVal,
    ]);
    // allowance is i128
    return retval.i128().lo().toString();
  } catch (e) {
    console.error("error fetching allowance", e);
    return "0";
  }
}

/**
 * Fetch total treasury fees
 */
export async function fetchTotalTreasuryFees() {
  try {
    const retval = await simulateCall(TREASURY_ID, "total_fees");
    return retval.i128().lo().toString();
  } catch (e) {
    console.error("error fetching total fees", e);
    return "0";
  }
}

/**
 * Build transaction for approving lottery contract spend
 */
export async function buildApproveTx(userAddress, amountStroops) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);

  const contract = new Contract(XLM_SAC_ID);

  // Fetch current ledger to set expiration_ledger safely
  const latestLedger = await server.getLatestLedger();
  const expirationLedger = latestLedger.sequence + 5000; // ~7 hours buffer

  const op = contract.call(
    "approve",
    Address.fromString(userAddress).toScVal(),
    Address.fromString(LOTTERY_ID).toScVal(),
    xdr.ScVal.scvI128(new xdr.Int128Parts({
      lo: xdr.Uint64.fromString(amountStroops.toString()),
      hi: xdr.Int64.fromString("0")
    })),
    xdr.ScVal.scvU32(expirationLedger)
  );

  const tx = new TransactionBuilder(account, {
    fee: "10000", // Buffer fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  // Assemble Soroban resource footprint before the wallet signs it.
  return await server.prepareTransaction(tx);
}

/**
 * Build transaction for buying a ticket
 */
export async function buildBuyTicketTx(userAddress, roundId) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(LOTTERY_ID);

  const op = contract.call(
    "buy_ticket",
    Address.fromString(userAddress).toScVal(),
    xdr.ScVal.scvU32(roundId)
  );

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  return await server.prepareTransaction(tx);
}

/**
 * Build transaction for opening a new round
 */
export async function buildOpenRoundTx(userAddress, durationSecs) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(LOTTERY_ID);

  const op = contract.call(
    "open_round",
    xdr.ScVal.scvU64(xdr.Uint64.fromString(durationSecs.toString()))
  );

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  return await server.prepareTransaction(tx);
}

/**
 * Build transaction for settling a round
 */
export async function buildSettleRoundTx(userAddress, roundId) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(LOTTERY_ID);

  const op = contract.call(
    "settle_round",
    xdr.ScVal.scvU32(roundId)
  );

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  return await server.prepareTransaction(tx);
}

/**
 * Helper to fetch the account (address + sequence) for transaction building.
 * Uses Soroban RPC rather than Horizon: RPC reflects the latest closed ledger
 * immediately, while Horizon ingestion can lag a few seconds — which caused
 * txBAD_SEQ when chaining transactions (e.g. approve → buy_ticket).
 */
async function fetchAccountDetails(userAddress) {
  const server = getRpcServer();
  return await server.getAccount(userAddress);
}

/**
 * Submit signed transaction XDR to Soroban RPC
 */
export async function submitTx(signedXdr) {
  const server = getRpcServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  if (response.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${response.errorResult?.result()?.switch()?.name || "rejected by the network"}`
    );
  }

  // PENDING / DUPLICATE / TRY_AGAIN_LATER — poll until the tx lands.
  // NOTE: getTransaction returns "NOT_FOUND" until the tx is included in a
  // closed ledger (~5s cadence), so NOT_FOUND means "keep waiting", not
  // failure. Poll up to ~50s before giving up.
  let getTxResp = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    getTxResp = await server.getTransaction(response.hash);
    if (getTxResp.status !== "NOT_FOUND") break;
  }

  if (getTxResp?.status === "SUCCESS") {
    return {
      hash: response.hash,
      success: true,
    };
  }

  if (getTxResp?.status === "FAILED") {
    throw new Error(
      `Transaction failed on-chain (hash ${response.hash}). Check it on Stellar Expert for details.`
    );
  }

  throw new Error(
    `Transaction not confirmed after 50s (hash ${response.hash}). It may still land — check Stellar Expert before retrying.`
  );
}

/**
 * Fetch contract admin address
 */
export async function fetchAdmin() {
  try {
    const retval = await simulateCall(LOTTERY_ID, "fetch_admin");
    return Address.fromScVal(retval).toString();
  } catch (e) {
    console.error("error fetching admin address", e);
    return null;
  }
}
