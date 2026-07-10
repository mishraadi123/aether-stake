#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    SweepstakesContract,
    CouponHolding(Address, u32), // (Owner, RoundId) -> Count
    CouponSupply(u32),            // RoundId -> total count of tickets
    CouponIndex(u32, u32), // (RoundId, Index) -> Owner Address
}

#[contract]
pub struct SweepCouponContract;

#[contractimpl]
impl SweepCouponContract {
    pub fn setup_ticket(env: Env, sweepstakes_contract: Address) {
        if env.storage().instance().has(&DataKey::SweepstakesContract) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::SweepstakesContract, &sweepstakes_contract);
    }

    pub fn get_parent_pool(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::SweepstakesContract)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn issue_entry_coupon(env: Env, to: Address, round_id: u32) {
        let parent = Self::get_parent_pool(env.clone());
        parent.require_auth();

        let count_key = DataKey::CouponSupply(round_id);
        let mut count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);

        // Map: (round_id, index) -> owner
        let index_key = DataKey::CouponIndex(round_id, count);
        env.storage().persistent().set(&index_key, &to);

        // Update buyer's ticket count for this round
        let bal_key = DataKey::CouponHolding(to.clone(), round_id);
        let user_bal: u32 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        env.storage().persistent().set(&bal_key, &(user_bal + 1));

        // Increment count
        count = count.saturating_add(1);
        env.storage().persistent().set(&count_key, &count);
    }

    pub fn coupon_balance(env: Env, owner: Address, round_id: u32) -> u32 {
        let bal_key = DataKey::CouponHolding(owner, round_id);
        env.storage().persistent().get(&bal_key).unwrap_or(0)
    }

    // Helper function for the lottery contract to resolve the winning index to owner
    pub fn resolve_coupon_holder(env: Env, round_id: u32, index: u32) -> Address {
        let index_key = DataKey::CouponIndex(round_id, index);
        env.storage()
            .persistent()
            .get(&index_key)
            .unwrap_or_else(|| panic!("index out of bounds"))
    }

    // Helper function for the lottery contract to query total tickets
    pub fn total_coupons_issued(env: Env, round_id: u32) -> u32 {
        let count_key = DataKey::CouponSupply(round_id);
        env.storage().persistent().get(&count_key).unwrap_or(0)
    }
}
