#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Lottery,
    Balance(Address, u32), // (Owner, RoundId) -> Count
    Count(u32),            // RoundId -> total count of tickets
    HolderIndex(u32, u32), // (RoundId, Index) -> Owner Address
}

#[contract]
pub struct TicketContract;

#[contractimpl]
impl TicketContract {
    pub fn init(env: Env, lottery_contract: Address) {
        if env.storage().instance().has(&DataKey::Lottery) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Lottery, &lottery_contract);
    }

    pub fn fetch_lottery(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Lottery)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn mint(env: Env, to: Address, round_id: u32) {
        let lottery = Self::fetch_lottery(env.clone());
        lottery.require_auth();

        let count_key = DataKey::Count(round_id);
        let mut count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);

        // Map: (round_id, index) -> owner
        let index_key = DataKey::HolderIndex(round_id, count);
        env.storage().persistent().set(&index_key, &to);

        // Update buyer's ticket count for this round
        let bal_key = DataKey::Balance(to.clone(), round_id);
        let user_bal: u32 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        env.storage().persistent().set(&bal_key, &(user_bal + 1));

        // Increment count
        count = count.saturating_add(1);
        env.storage().persistent().set(&count_key, &count);
    }

    pub fn balance(env: Env, owner: Address, round_id: u32) -> u32 {
        let bal_key = DataKey::Balance(owner, round_id);
        env.storage().persistent().get(&bal_key).unwrap_or(0)
    }

    // Helper function for the lottery contract to resolve the winning index to owner
    pub fn get_owner(env: Env, round_id: u32, index: u32) -> Address {
        let index_key = DataKey::HolderIndex(round_id, index);
        env.storage()
            .persistent()
            .get(&index_key)
            .unwrap_or_else(|| panic!("index out of bounds"))
    }

    // Helper function for the lottery contract to query total tickets
    pub fn get_ticket_count(env: Env, round_id: u32) -> u32 {
        let count_key = DataKey::Count(round_id);
        env.storage().persistent().get(&count_key).unwrap_or(0)
    }
}
