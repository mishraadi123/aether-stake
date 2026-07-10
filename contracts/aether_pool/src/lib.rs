#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, IntoVal, Symbol, Val,
};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct CycleDetails {
    pub round_id: u32,
    pub status: u32, // 0 = inactive/voided, 1 = active, 2 = settled
    pub ticket_count: u32,
    pub ticket_price: i128,
    pub pot: i128,
    pub close_time: u64,
    pub winner: Option<Address>,
}

#[derive(Clone)]
#[contracttype]
pub enum StorageKey {
    SuperUser,
    CouponIssuer,
    CommissionVault,
    Asset,
    EntryCost,
    TaxBps,
    ActiveRoundSequence,
    SweepstakesCycle(u32),
}

#[contract]
pub struct AetherPoolContract;

#[contractimpl]
impl AetherPoolContract {
    pub fn setup_aether_draw(
        env: Env,
        admin: Address,
        coupon_issuer: Address,
        commission_vault: Address,
        asset: Address,
        entry_cost: i128,
        tax_bps: u32,
    ) {
        if env.storage().instance().has(&StorageKey::SuperUser) {
            panic!("already initialized");
        }
        env.storage().instance().set(&StorageKey::SuperUser, &admin);
        env.storage().instance().set(&StorageKey::CouponIssuer, &coupon_issuer);
        env.storage().instance().set(&StorageKey::CommissionVault, &commission_vault);
        env.storage().instance().set(&StorageKey::Asset, &asset);
        env.storage().instance().set(&StorageKey::EntryCost, &entry_cost);
        env.storage().instance().set(&StorageKey::TaxBps, &tax_bps);
        env.storage().instance().set(&StorageKey::ActiveRoundSequence, &0u32);
    }

    pub fn get_administrator(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&StorageKey::SuperUser)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn start_sweepstakes_round(env: Env, duration_secs: u64) -> u32 {
        let admin = Self::get_administrator(env.clone());
        admin.require_auth();

        let mut current_id: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::ActiveRoundSequence)
            .unwrap_or(0);

        if current_id > 0 {
            let last_round_key = StorageKey::SweepstakesCycle(current_id);
            if env.storage().persistent().has(&last_round_key) {
                let last_round: CycleDetails = env
                    .storage()
                    .persistent()
                    .get(&last_round_key)
                    .unwrap();
                if last_round.status == 1 {
                    panic!("previous round is still active");
                }
            }
        }

        current_id = current_id.saturating_add(1);
        let close_time = env.ledger().timestamp().saturating_add(duration_secs);
        let entry_cost: i128 = env.storage().instance().get(&StorageKey::EntryCost).unwrap_or(0);

        let round_info = CycleDetails {
            round_id: current_id,
            status: 1, // active
            ticket_count: 0,
            ticket_price: entry_cost,
            pot: 0,
            close_time,
            winner: None,
        };

        env.storage().instance().set(&StorageKey::ActiveRoundSequence, &current_id);
        env.storage().persistent().set(&StorageKey::SweepstakesCycle(current_id), &round_info);

        // Publish event
        let event_data: soroban_sdk::Vec<Val> = soroban_sdk::vec![
            &env,
            close_time.into_val(&env)
        ];
        env.events().publish((Symbol::new(&env, "cycle_started"), current_id), event_data);

        current_id
    }

    pub fn purchase_entry_ticket(env: Env, buyer: Address, round_id: u32) {
        buyer.require_auth();

        let round_key = StorageKey::SweepstakesCycle(round_id);
        let mut round: CycleDetails = env
            .storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"));

        if round.status != 1 {
            panic!("round is not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time >= round.close_time {
            panic!("round already closed");
        }

        let asset = env.storage().instance().get(&StorageKey::Asset).unwrap_or_else(|| panic!("no token"));

        // Pull funds from buyer to this contract
        let args = soroban_sdk::vec![
            &env,
            env.current_contract_address().into_val(&env), // spender
            buyer.into_val(&env), // from
            env.current_contract_address().into_val(&env), // to
            round.ticket_price.into_val(&env) // amount
        ];
        let _: () = env.invoke_contract(
            &asset,
            &Symbol::new(&env, "transfer_from"),
            args,
        );

        let coupon_issuer = env.storage().instance().get(&StorageKey::CouponIssuer).unwrap_or_else(|| panic!("no ticket contract"));

        // Mint one ticket token to buyer
        let mint_args = soroban_sdk::vec![
            &env,
            buyer.clone().into_val(&env),
            round_id.into_val(&env)
        ];
        let _: () = env.invoke_contract(
            &coupon_issuer,
            &Symbol::new(&env, "issue_entry_coupon"),
            mint_args,
        );

        // Update round stats
        round.ticket_count = round.ticket_count.saturating_add(1);
        round.pot = round.ticket_price.saturating_mul(round.ticket_count as i128);
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, buyer.into_val(&env)];
        env.events().publish((Symbol::new(&env, "coupon_minted"), round_id), event_data);
    }

    pub fn resolve_and_draw(env: Env, round_id: u32) -> Address {
        let round_key = StorageKey::SweepstakesCycle(round_id);
        let mut round: CycleDetails = env
            .storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"));

        if round.status != 1 {
            panic!("round is not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time < round.close_time {
            panic!("round timer has not expired");
        }

        let coupon_issuer = env.storage().instance().get(&StorageKey::CouponIssuer).unwrap_or_else(|| panic!("no ticket contract"));

        if round.ticket_count == 0 {
            // Void the round
            round.status = 0; // inactive/voided
            env.storage().persistent().set(&round_key, &round);

            // Publish event
            env.events().publish((Symbol::new(&env, "cycle_cancelled"), round_id), ());

            return env.current_contract_address();
        }

        // Draw winner via pseudo-randomness
        let mut data = Bytes::new(&env);
        data.extend_from_array(&env.ledger().timestamp().to_be_bytes());
        data.extend_from_array(&(env.ledger().sequence() as u64).to_be_bytes());
        data.extend_from_array(&(round_id as u64).to_be_bytes());
        data.extend_from_array(&(round.ticket_count as u64).to_be_bytes());

        let hash = env.crypto().sha256(&data);
        let hash_arr = hash.to_array();
        let mut first_8 = [0u8; 8];
        first_8.copy_from_slice(&hash_arr[0..8]);
        let seed_as_u64 = u64::from_be_bytes(first_8);
        let winning_ticket_index = (seed_as_u64 % (round.ticket_count as u64)) as u32;

        // Resolve winning index to Address
        let winner: Address = env.invoke_contract(
            &coupon_issuer,
            &Symbol::new(&env, "resolve_coupon_holder"),
            soroban_sdk::vec![&env, round_id.into_val(&env), winning_ticket_index.into_val(&env)],
        );

        let tax_bps: u32 = env.storage().instance().get(&StorageKey::TaxBps).unwrap_or(0);
        let pot = round.pot;
        let fee = (pot * (tax_bps as i128)) / 10000;
        let payout = pot - fee;

        let asset = env.storage().instance().get(&StorageKey::Asset).unwrap_or_else(|| panic!("no token"));

        // 1. Transfer payout to winner
        if payout > 0 {
            let args_winner = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                winner.clone().into_val(&env),
                payout.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &asset,
                &Symbol::new(&env, "transfer"),
                args_winner,
            );
        }

        let commission_vault: Address = env.storage().instance().get(&StorageKey::CommissionVault).unwrap_or_else(|| panic!("no treasury contract"));

        // 2. Transfer fee to treasury and call deposit_fee
        if fee > 0 {
            let args_treasury = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                commission_vault.clone().into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &asset,
                &Symbol::new(&env, "transfer"),
                args_treasury,
            );

            let deposit_args = soroban_sdk::vec![
                &env,
                round_id.into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &commission_vault,
                &Symbol::new(&env, "record_commission"),
                deposit_args,
            );
        }

        // Finalize round status
        round.status = 2; // settled
        round.winner = Some(winner.clone());
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, winner.clone().into_val(&env)];
        env.events().publish((Symbol::new(&env, "cycle_resolved"), round_id), event_data);

        winner
    }

    pub fn fetch_round_details(env: Env, round_id: u32) -> CycleDetails {
        let round_key = StorageKey::SweepstakesCycle(round_id);
        env.storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"))
    }

    pub fn fetch_user_entry_count(env: Env, round_id: u32, owner: Address) -> u32 {
        let coupon_issuer = env.storage().instance().get(&StorageKey::CouponIssuer).unwrap_or_else(|| panic!("no ticket contract"));
        let args = soroban_sdk::vec![
            &env,
            owner.into_val(&env),
            round_id.into_val(&env)
        ];
        let bal: u32 = env.invoke_contract(
            &coupon_issuer,
            &Symbol::new(&env, "coupon_balance"),
            args,
        );
        bal
    }

    pub fn fetch_active_round_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&StorageKey::ActiveRoundSequence)
            .unwrap_or(0)
    }
}

mod test;
