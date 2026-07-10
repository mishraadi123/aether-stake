import { Contract, rpc, Horizon, TransactionBuilder, Account, Keypair, Address, xdr } from "@stellar/stellar-sdk";
import { convertXlmToStroops, convertStroopsToXlm } from "./formatter";

export { convertXlmToStroops, convertStroopsToXlm };

export const AETHER_POOL_ID = "CDCS5U2B2Q4IE5HFGNWNLE7J2CRRYNUFERTKIAZS5MZ5J75FIFLNXBYB";
export const SWEEP_COUPON_ID = "CAW2RSAP56H4RZZGAZUBVIXYPU2GIOHKC6JHGDMO7L5LDT5ON6TENM4F";
export const COMMISSION_VAULT_ID = "CBRKHWVDHZULX6PLAFD2ADGDRMVSJ67WOEGSVSKJRNO5YWHQH42XHCMM";
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
export async function queryActiveRoundSequence() {
  const retval = await simulateCall(AETHER_POOL_ID, "fetch_active_round_id");
  return retval.u32();
}

/**
 * Fetch cycle details
 */
export async function queryCycleDetails(roundId) {
  const retval = await simulateCall(AETHER_POOL_ID, "fetch_round_details", [
    xdr.ScVal.scvU32(roundId),
  ]);
  
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
    else if (key === "ticket_price") ticket_price = val.i128().lo().toString();
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
 * Fetch user's entry tickets in a round
 */
export async function queryUserEntryCount(roundId, userAddress) {
  try {
    const userScVal = Address.fromString(userAddress).toScVal();
    const retval = await simulateCall(AETHER_POOL_ID, "fetch_user_entry_count", [
      xdr.ScVal.scvU32(roundId),
      userScVal,
    ]);
    return retval.u32();
  } catch (e) {
    console.warn("error fetching user tickets", e);
    return 0;
  }
}

/**
 * Fetch user's native XLM balance via Horizon
 */
export async function queryXlmBalance(userAddress) {
  try {
    const horizon = getHorizonServer();
    const account = await horizon.loadAccount(userAddress);
    const balanceObj = account.balances.find((b) => b.asset_type === "native");
    return balanceObj ? balanceObj.balance : "0";
  } catch (e) {
    console.warn("error fetching balance", e);
    return "0";
  }
}

/**
 * Fetch current allowance of aether pool contract over user's XLM
 */
export async function queryAllowance(userAddress) {
  try {
    const userScVal = Address.fromString(userAddress).toScVal();
    const spenderScVal = Address.fromString(AETHER_POOL_ID).toScVal();
    const retval = await simulateCall(XLM_SAC_ID, "allowance", [
      userScVal,
      spenderScVal,
    ]);
    return retval.i128().lo().toString();
  } catch (e) {
    console.warn("error fetching allowance", e);
    return "0";
  }
}

/**
 * Fetch total treasury fees
 */
export async function queryAccumulatedCommissions() {
  try {
    const retval = await simulateCall(COMMISSION_VAULT_ID, "accumulated_commissions");
    return retval.i128().lo().toString();
  } catch (e) {
    console.warn("error fetching total fees", e);
    return "0";
  }
}

/**
 * Build transaction for approving aether pool contract spend
 */
export async function constructApproveTx(userAddress, amountStroops) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(XLM_SAC_ID);

  const latestLedger = await server.getLatestLedger();
  const expirationLedger = latestLedger.sequence + 5000;

  const op = contract.call(
    "approve",
    Address.fromString(userAddress).toScVal(),
    Address.fromString(AETHER_POOL_ID).toScVal(),
    xdr.ScVal.scvI128(new xdr.Int128Parts({
      lo: xdr.Uint64.fromString(amountStroops.toString()),
      hi: xdr.Int64.fromString("0")
    })),
    xdr.ScVal.scvU32(expirationLedger)
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
 * Build transaction for buying a ticket
 */
export async function constructBuyTicketTx(userAddress, roundId) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(AETHER_POOL_ID);

  const op = contract.call(
    "purchase_entry_ticket",
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
export async function constructOpenRoundTx(userAddress, durationSecs) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(AETHER_POOL_ID);

  const op = contract.call(
    "start_sweepstakes_round",
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
export async function constructSettleRoundTx(userAddress, roundId) {
  const server = getRpcServer();
  const account = await fetchAccountDetails(userAddress);
  const contract = new Contract(AETHER_POOL_ID);

  const op = contract.call(
    "resolve_and_draw",
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

async function fetchAccountDetails(userAddress) {
  const server = getRpcServer();
  return await server.getAccount(userAddress);
}

/**
 * Submit signed transaction XDR to Soroban RPC
 */
export async function broadcastTransaction(signedXdr) {
  const server = getRpcServer();
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  if (response.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${response.errorResult?.result()?.switch()?.name || "rejected by the network"}`
    );
  }

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
export async function queryAdministrator() {
  try {
    const retval = await simulateCall(AETHER_POOL_ID, "get_administrator");
    return Address.fromScVal(retval).toString();
  } catch (e) {
    console.warn("error fetching admin address", e);
    return null;
  }
}
