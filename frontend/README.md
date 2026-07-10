# Aether Sweepstakes — Frontend

Next.js (App Router, static export) client for the Aether Sweepstakes Soroban contracts.

All contract addresses, transaction evidence, screenshots, and challenge-compliance
documentation live in the **[root README](../README.md)** — this file only covers
frontend development. Keeping evidence in one place avoids the two documents drifting
out of sync.

## Structure

- `src/core/stellar/` — chain access layer: `client.js` (contract IDs, simulation reads, tx builders, submission), `events.js` (Soroban RPC `getEvents` polling for the live activity feed), `formatter.js` (XLM ⇄ stroop conversion, unit-tested).
- `src/modules/wallet/WalletProvider.js` — StellarWalletsKit integration (Freighter, Albedo, xBull), connection state, 10s on-chain polling, transaction signing pipeline, and user-facing error mapping.
- `src/modules/layout/AppLayout.js` — shared shell (nav, wallet controls, footer).
- `src/app/` — routes: home, play, rounds, winners, activity (live event feed), fairness (draw verification), plus static info pages.

## Develop

```bash
npm install
npm run dev
```

## Test

Pure conversion logic is covered with Node's built-in test runner:

```bash
npm test
```

## Build (static export)

```bash
npm run build   # outputs to out/
```

Contract addresses are set in `src/core/stellar/client.js`. If you redeploy the
contracts, update the three IDs there (see the root README's deployment section).
