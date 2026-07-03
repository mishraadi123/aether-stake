#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, IntoVal, Symbol, Val,
};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct RoundInfo {
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
pub enum DataKey {
    Admin,
    TicketContract,
    TreasuryContract,
    Token,
    TicketPrice,
    FeeBps,
    CurrentRoundId,
    Round(u32),
}

#[contract]
pub struct LotteryContract;

#[contractimpl]
impl LotteryContract {
    pub fn init(
        env: Env,
        admin: Address,
        ticket_contract: Address,
        treasury_contract: Address,
        token: Address,
        ticket_price: i128,
        fee_bps: u32,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TicketContract, &ticket_contract);
        env.storage().instance().set(&DataKey::TreasuryContract, &treasury_contract);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TicketPrice, &ticket_price);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::CurrentRoundId, &0u32);
    }

    pub fn fetch_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn open_round(env: Env, duration_secs: u64) -> u32 {
        let admin = Self::fetch_admin(env.clone());
        admin.require_auth();

        let mut current_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CurrentRoundId)
            .unwrap_or(0);

        if current_id > 0 {
            let last_round_key = DataKey::Round(current_id);
            if env.storage().persistent().has(&last_round_key) {
                let last_round: RoundInfo = env
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
        let ticket_price: i128 = env.storage().instance().get(&DataKey::TicketPrice).unwrap_or(0);

        let round_info = RoundInfo {
            round_id: current_id,
            status: 1, // active
            ticket_count: 0,
            ticket_price,
            pot: 0,
            close_time,
            winner: None,
        };

        env.storage().instance().set(&DataKey::CurrentRoundId, &current_id);
        env.storage().persistent().set(&DataKey::Round(current_id), &round_info);

        // Publish event
        let event_data: soroban_sdk::Vec<Val> = soroban_sdk::vec![
            &env,
            close_time.into_val(&env)
        ];
        env.events().publish((Symbol::new(&env, "round_opened"), current_id), event_data);

        current_id
    }

    pub fn buy_ticket(env: Env, buyer: Address, round_id: u32) {
        buyer.require_auth();

        let round_key = DataKey::Round(round_id);
        let mut round: RoundInfo = env
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

        let token = env.storage().instance().get(&DataKey::Token).unwrap_or_else(|| panic!("no token"));

        // Pull funds from buyer to this contract
        let args = soroban_sdk::vec![
            &env,
            env.current_contract_address().into_val(&env), // spender
            buyer.into_val(&env), // from
            env.current_contract_address().into_val(&env), // to
            round.ticket_price.into_val(&env) // amount
        ];
        let _: () = env.invoke_contract(
            &token,
            &Symbol::new(&env, "transfer_from"),
            args,
        );

        let ticket_contract = env.storage().instance().get(&DataKey::TicketContract).unwrap_or_else(|| panic!("no ticket contract"));

        // Mint one ticket token to buyer
        let mint_args = soroban_sdk::vec![
            &env,
            buyer.clone().into_val(&env),
            round_id.into_val(&env)
        ];
        let _: () = env.invoke_contract(
            &ticket_contract,
            &Symbol::new(&env, "mint"),
            mint_args,
        );

        // Update round stats
        round.ticket_count = round.ticket_count.saturating_add(1);
        round.pot = round.ticket_price.saturating_mul(round.ticket_count as i128);
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, buyer.into_val(&env)];
        env.events().publish((Symbol::new(&env, "ticket_bought"), round_id), event_data);
    }

    pub fn settle_round(env: Env, round_id: u32) -> Address {
        let round_key = DataKey::Round(round_id);
        let mut round: RoundInfo = env
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

        let ticket_contract = env.storage().instance().get(&DataKey::TicketContract).unwrap_or_else(|| panic!("no ticket contract"));

        if round.ticket_count == 0 {
            // Void the round
            round.status = 0; // inactive/voided
            env.storage().persistent().set(&round_key, &round);

            // Publish event
            env.events().publish((Symbol::new(&env, "round_voided"), round_id), ());

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
            &ticket_contract,
            &Symbol::new(&env, "get_owner"),
            soroban_sdk::vec![&env, round_id.into_val(&env), winning_ticket_index.into_val(&env)],
        );

        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let pot = round.pot;
        let fee = (pot * (fee_bps as i128)) / 10000;
        let payout = pot - fee;

        let token = env.storage().instance().get(&DataKey::Token).unwrap_or_else(|| panic!("no token"));

        // 1. Transfer payout to winner
        if payout > 0 {
            let args_winner = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                winner.clone().into_val(&env),
                payout.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &token,
                &Symbol::new(&env, "transfer"),
                args_winner,
            );
        }

        let treasury: Address = env.storage().instance().get(&DataKey::TreasuryContract).unwrap_or_else(|| panic!("no treasury contract"));

        // 2. Transfer fee to treasury and call deposit_fee
        if fee > 0 {
            let args_treasury = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                treasury.clone().into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &token,
                &Symbol::new(&env, "transfer"),
                args_treasury,
            );

            let deposit_args = soroban_sdk::vec![
                &env,
                round_id.into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &treasury,
                &Symbol::new(&env, "deposit_fee"),
                deposit_args,
            );
        }

        // Finalize round status
        round.status = 2; // settled
        round.winner = Some(winner.clone());
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, winner.clone().into_val(&env)];
        env.events().publish((Symbol::new(&env, "round_settled"), round_id), event_data);

        winner
    }

    pub fn get_round(env: Env, round_id: u32) -> RoundInfo {
        let round_key = DataKey::Round(round_id);
        env.storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"))
    }

    pub fn get_tickets(env: Env, round_id: u32, owner: Address) -> u32 {
        let ticket_contract = env.storage().instance().get(&DataKey::TicketContract).unwrap_or_else(|| panic!("no ticket contract"));
        let args = soroban_sdk::vec![
            &env,
            owner.into_val(&env),
            round_id.into_val(&env)
        ];
        let bal: u32 = env.invoke_contract(
            &ticket_contract,
            &Symbol::new(&env, "balance"),
            args,
        );
        bal
    }

    pub fn get_current_round_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::CurrentRoundId)
            .unwrap_or(0)
    }
}

mod test;
