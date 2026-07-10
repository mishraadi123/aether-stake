import { scValToNative } from "@stellar/stellar-sdk";
import { getRpcServer, AETHER_POOL_ID, COMMISSION_VAULT_ID } from "./client";

/**
 * Fetch recent contract events for the pool + vault via Soroban RPC getEvents.
 *
 * getEvents scans forward from startLedger and returns one page at a time —
 * a deep lookback yields an EMPTY first page (old ledgers) plus a cursor, not
 * an error. So we walk the cursor across pages until the scan catches up to
 * the present, with a hard page cap to bound the work per refresh.
 */
const LOOKBACK_LEDGERS = 12000; // ≈17h at 5s/ledger
const SHALLOW_LOOKBACK = 1000; // fallback if the deep start is outside retention
const MAX_PAGES = 6;
const PAGE_LIMIT = 200;

export async function fetchRecentActivity(limit = 30) {
  const server = getRpcServer();
  const { sequence: latest } = await server.getLatestLedger();
  const filters = [
    { type: "contract", contractIds: [AETHER_POOL_ID, COMMISSION_VAULT_ID] },
  ];

  const collected = [];
  let cursor = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    let response;
    try {
      response = await server.getEvents(
        cursor
          ? { filters, cursor, limit: PAGE_LIMIT }
          : { startLedger: Math.max(1, latest - LOOKBACK_LEDGERS), filters, limit: PAGE_LIMIT }
      );
    } catch (err) {
      if (page === 0) {
        // Deep start outside the RPC's retention window — retry shallow
        response = await server.getEvents({
          startLedger: Math.max(1, latest - SHALLOW_LOOKBACK),
          filters,
          limit: PAGE_LIMIT,
        });
      } else {
        break;
      }
    }

    collected.push(...(response.events || []));
    cursor = response.cursor || null;
    if (!cursor) break;
  }

  return decodeEvents(collected).slice(-limit).reverse();
}

function decodeEvents(rawEvents) {
  return rawEvents
    .map((ev) => {
      try {
        const topics = (ev.topic || []).map((t) => scValToNative(t));
        const name = typeof topics[0] === "string" ? topics[0] : "unknown";
        const roundId = typeof topics[1] === "number" ? topics[1] : null;
        let data = null;
        try {
          data = ev.value ? scValToNative(ev.value) : null;
        } catch {
          data = null;
        }
        const contractId =
          typeof ev.contractId === "string"
            ? ev.contractId
            : ev.contractId?.toString?.() || "";
        return {
          id: ev.id,
          name,
          roundId,
          data,
          contractId,
          ledger: ev.ledger,
          closedAt: ev.ledgerClosedAt,
          txHash: ev.txHash || null,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
