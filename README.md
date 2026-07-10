# Aether Sweepstakes Protocol — Stellar/Soroban Workspace

Aether Sweepstakes is a premium, high-density minimalist fintech platform for timed capital pool yield accumulators running on the Stellar Soroban Testnet. The application uses a multi-contract architecture to facilitate entry coupon minting, commission distribution, and ledger-random draw settlement.

---

## 1. Official Challenge Criteria Compliance Checklist

Reviewers can verify checklist alignment using the explicit headings below:

### Wallet Authorization
- Integrates with the Freighter extension on the Stellar Testnet.
- Securely requests permissions to sign operations.
- Automatically handles reconnection and account switching.

### Connection Framework
- Dynamic and visible `Connect Wallet` and `Disconnect` action elements.
- Clean connection indicators mapping network details (Soroban Testnet).

### Balance Interface
- Real-time client query of the active wallet's native XLM balance via Horizon APIs.
- Auto-updated balances with high-precision decimals representation.

### Transaction Pipeline
- Submits approve transactions and entry coupon acquisitions on-chain.
- Detailed progress tracker logging transition steps from broadcast to confirmation.

### Multi-Wallet Adapter
- Implements `@creit.tech/stellar-wallets-kit` (StellarWalletsKit) to offer users Freighter, Albedo, and xBull integrations.
- Dynamic modules loaded client-side only to prevent Next.js SSR hydration mismatches.

### Granular Exception Handling
- Visual boundaries and warnings handling three core exception pathways:
  1. **Wallet Not Found**: freighter extension missing or blocked.
  2. **Signature Rejected**: user cancels the Freighter approve/sign popup.
  3. **Insufficient Network Balance**: user attempts actions exceeding their testnet XLM holdings.

### Contract Execution
- Direct invocation of Soroban smart contracts on the Testnet.
- Reads contract state via RPC simulation endpoints and submits state-changing transactions.

### Status & Sync Tracking
- Near-real-time updates via polling (every 10 seconds) syncing the active pot, entries count, and timer states.
- Live progress modals indicating `Pending` ➔ `Success` or `Failure` of transactions.

### Inter-Contract Cross Invocations
- The Aether Pool coordinator contract communicates directly with the Sweep Coupon token contract and the Commission Vault contract on-chain via `env.invoke_contract`.

### Real-Time Data Streaming
- Contracts emit on-chain events for every lifecycle action: `cycle_started`, `coupon_minted`, `cycle_resolved`, `cycle_cancelled` (pool) and `commission_received`, `reserve_disbursed` (vault).
- The dedicated **/activity** page reads these events back via Soroban RPC `getEvents` and renders a live feed (8s polling) with direct Stellar Expert links per transaction — nothing mocked.
- Global state (pot, entries, countdown, vault balance) additionally re-syncs every 10 seconds without a page reload.
- The **/fairness** page exposes the exact draw code and lets anyone query any cycle's on-chain state live from the browser.

### Responsive Adaptations
- Fully fluid, mobile-first design grid tested down to ~375px viewports (iPhone SE) and ~768px viewports (iPad layouts).

### Automated Verification Workflows
- Continuous Integration workflow checks code formatting, lints JavaScript/Rust, and builds WASM binaries and frontend bundles on push.

---

## 2. Dedicated Technical Specifications

### Inter-Contract Calls
Aether Sweepstakes utilizes three active contract layers compiling down to WASM targets on the Soroban architecture. Cross-contract communication uses the SDK invocation primitive:
```rust
env.invoke_contract::<ReturnType>(target_address, function_name, arguments_vector)
```

Target functions and modular workflows:
1. **Sweep Coupon Minting**: During `purchase_entry_ticket`, the Aether Pool contract calls `issue_entry_coupon` on the Sweep Coupon contract:
   - **Signature**: `issue_entry_coupon(env: Env, to: Address, round_id: u32) -> ()`
2. **Coupon Holder Resolution**: During `resolve_and_draw`, the coordinator calls `resolve_coupon_holder` on the Sweep Coupon contract to query the winner:
   - **Signature**: `resolve_coupon_holder(env: Env, round_id: u32, index: u32) -> Address`
3. **Commission Vault Recording**: During `resolve_and_draw`, the coordinator transfers the fee and calls `record_commission` on the Commission Vault:
   - **Signature**: `record_commission(env: Env, round_id: u32, amount: i128) -> ()`

### Deployment Addresses & Transaction Hashes
All deployed contracts are fully verified on the Stellar Testnet:

| Contract / Entity | Address (56 characters, starts with C) | explorer Link |
|---|---|---|
| **Aether Pool Coordinator** | `CDCS5U2B2Q4IE5HFGNWNLE7J2CRRYNUFERTKIAZS5MZ5J75FIFLNXBYB` | [Explore on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDCS5U2B2Q4IE5HFGNWNLE7J2CRRYNUFERTKIAZS5MZ5J75FIFLNXBYB) |
| **Sweep Coupon Token** | `CAW2RSAP56H4RZZGAZUBVIXYPU2GIOHKC6JHGDMO7L5LDT5ON6TENM4F` | [Explore on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAW2RSAP56H4RZZGAZUBVIXYPU2GIOHKC6JHGDMO7L5LDT5ON6TENM4F) |
| **Commission Vault** | `CBRKHWVDHZULX6PLAFD2ADGDRMVSJ67WOEGSVSKJRNO5YWHQH42XHCMM` | [Explore on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBRKHWVDHZULX6PLAFD2ADGDRMVSJ67WOEGSVSKJRNO5YWHQH42XHCMM) |
| **Native XLM SAC Wrapper** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [Explore on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

### Verified Transaction Evidence (this deployment)

Contract deployment (created by `GBLJ…FTPV`, 2026-07-09):

| Action | Tx Hash |
|---|---|
| Deploy Sweep Coupon | [`f327cb67c9313f46ea6926ef4b8ec081730b07b9bceaf19331e1bdcc5da70137`](https://stellar.expert/explorer/testnet/tx/f327cb67c9313f46ea6926ef4b8ec081730b07b9bceaf19331e1bdcc5da70137) |
| Deploy Commission Vault | [`73306cbb100f7ed30fa7f355031df1a19b3d7605f42c8a0c7276abe798bc0718`](https://stellar.expert/explorer/testnet/tx/73306cbb100f7ed30fa7f355031df1a19b3d7605f42c8a0c7276abe798bc0718) |
| Deploy Aether Pool | [`6e9e6fdc67f0773ec0cba7a0c0850637cd393883df26416226d3ded56da32d7f`](https://stellar.expert/explorer/testnet/tx/6e9e6fdc67f0773ec0cba7a0c0850637cd393883df26416226d3ded56da32d7f) |
| Init pool (`setup_aether_draw`) | [`4b89d7be0c66d48fcae29092c6938b84ca85aaa03ca9f6d3da0eaffdde74fbb1`](https://stellar.expert/explorer/testnet/tx/4b89d7be0c66d48fcae29092c6938b84ca85aaa03ca9f6d3da0eaffdde74fbb1) |
| Init coupon (`setup_ticket`) | [`f11cae94e10a854371b98839a9ee583982784613ddd1c35f74904109baec98c5`](https://stellar.expert/explorer/testnet/tx/f11cae94e10a854371b98839a9ee583982784613ddd1c35f74904109baec98c5) |
| Init vault (`setup_treasury`) | [`4be42708706f98921b0932a78056bcaf79663490697205aa2db277862979141b`](https://stellar.expert/explorer/testnet/tx/4be42708706f98921b0932a78056bcaf79663490697205aa2db277862979141b) |
| Open cycle #1 (`start_sweepstakes_round`, signed by admin via Freighter) | [`8e5dc036b17dfb9e0bc70b28c6da6e512c048b8a3fcee28a6aefcd5220325d6f`](https://stellar.expert/explorer/testnet/tx/8e5dc036b17dfb9e0bc70b28c6da6e512c048b8a3fcee28a6aefcd5220325d6f) |

- **Administrator account:** `GC7SEQUPZUQSFX4HZECHCF5CSD7VYUVXCDREQBHQVS5BLDCOESCD33HL`
- **Full dispersal settlement (95% winner / 5% vault via inter-contract calls):** `PENDING — cycle #1 is currently open; buy entries and trigger the draw after expiry, then record the resolve_and_draw tx hash here. The transaction will show the pool invoking resolve_coupon_holder, the XLM transfers, and record_commission on the vault.`

---

## 3. Verification Evidence Logs

### Contract Test Coverage
Below is the verbose shell output printout from the executed Rust testing suite showcasing active assertions:

```text
running 12 tests
test test::test_lottery_initialization ... ok
test test::test_open_round_success ... ok
test test::test_ticket_unauthorized_mint - should panic ... ok
test test::test_open_round_fails_if_active - should panic ... ok
test test::test_settle_round_fails_before_close_time - should panic ... ok
test test::test_treasury_unauthorized_deposit - should panic ... ok
test test::test_buy_ticket_fails_if_closed - should panic ... ok
test test::test_buy_ticket_success ... ok
test test::test_settle_round_cannot_be_called_twice - should panic ... ok
test test::test_settle_round_voided_if_no_tickets ... ok
test test::test_settle_round_success ... ok
test test::test_winner_index_always_within_bounds ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s
```

### Frontend Unit Tests
Pure conversion logic (`frontend/src/core/stellar/formatter.js`) is covered with Node's built-in test runner — run `npm test` inside `frontend/`:

```text
✔ convertXlmToStroops converts whole XLM to stroops as BigInt
✔ convertXlmToStroops handles fractional XLM and floors sub-stroop amounts
✔ convertStroopsToXlm converts stroops back to an XLM string
✔ convertStroopsToXlm returns '0' for falsy input
✔ convertXlmToStroops and convertStroopsToXlm round-trip for typical ticket prices
✔ STROOPS_UNIT matches the 7-decimal native asset precision
ℹ tests 6 · pass 6 · fail 0
```

### Verification Screenshot Array
`PENDING — capture after publishing the repository:`
1. `PENDING` — Mobile responsive capture (~375px viewport)
2. `PENDING` — Green passing GitHub Actions run (requires the repo to be pushed to GitHub first)
3. `PENDING` — `cargo test` shell output capture

### Live Demo & Video
- **Live Demo URL:** `PENDING — deploy frontend/out via Cloudflare (wrangler.toml is configured)`
- **Demo Video (1–2 min):** `PENDING — record on the live client`

---

## 4. Local Workspace Setup & Operations

### Compile smart contracts
Build optimized Soroban WASM targets:
```bash
cargo build --release --target wasm32v1-none
```

### Run testing suites
Verify contract-level math and state variables:
```bash
cargo test
```

### Dev frontend server
Launch the Next.js Webpack hot-reloading dev environment:
```bash
cd frontend
npm install
npm run dev
```

### Build frontend production bundle
Compile and generate static HTML assets:
```bash
npm run build
```

### Deploy contracts to Testnet (reproducible)
```bash
# One-time: create and fund a deployer identity
stellar keys generate aether-deployer --network testnet --fund

# Deploy the three contracts
COUPON=$(stellar contract deploy --wasm target/wasm32v1-none/release/sweep_coupon.wasm     --source aether-deployer --network testnet)
VAULT=$(stellar contract deploy --wasm target/wasm32v1-none/release/commission_vault.wasm  --source aether-deployer --network testnet)
POOL=$(stellar contract deploy --wasm target/wasm32v1-none/release/aether_pool.wasm        --source aether-deployer --network testnet)
XLM=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC   # canonical testnet native SAC
ADMIN=<your G... admin address>

# Initialize (order matters; init requires no admin signature)
stellar contract invoke --id $COUPON --source aether-deployer --network testnet -- setup_ticket --sweepstakes_contract $POOL
stellar contract invoke --id $VAULT  --source aether-deployer --network testnet -- setup_treasury --admin $ADMIN --sweepstakes_contract $POOL --token $XLM
stellar contract invoke --id $POOL   --source aether-deployer --network testnet -- setup_aether_draw --admin $ADMIN --ticket_contract $COUPON --treasury_contract $VAULT --token $XLM --ticket_price 10000000 --fee_bps 500
```
Then set the three addresses in `frontend/src/core/stellar/client.js` (and the `.env` files).

---

## 5. License

MIT License.
