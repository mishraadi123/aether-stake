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
- Listens to Soroban contract events (`cycle_started`, `coupon_minted`, `cycle_resolved`) to dynamically update client states and logs.

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

Verified transaction hash for cycle settlement:
- **Draw Settlement Tx Hash**: `f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7`
- [Explore Settle Tx on Stellar Expert](https://stellar.expert/explorer/testnet/tx/f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7)

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
