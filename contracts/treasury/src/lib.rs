#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Lottery,
    Token,
    TotalFees,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn init(env: Env, admin: Address, lottery_contract: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Lottery, &lottery_contract);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TotalFees, &0i128);
    }

    pub fn fetch_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn fetch_lottery(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Lottery)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn fetch_token(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn deposit_fee(env: Env, round_id: u32, amount: i128) {
        let lottery = Self::fetch_lottery(env.clone());
        lottery.require_auth();

        if amount <= 0 {
            panic!("invalid fee amount");
        }

        // Increment total fees
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalFees).unwrap_or(0);
        total = total.saturating_add(amount);
        env.storage().instance().set(&DataKey::TotalFees, &total);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, amount.into_val(&env)];
        env.events().publish((Symbol::new(&env, "fee_deposited"), round_id), event_data);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let admin = Self::fetch_admin(env.clone());
        admin.require_auth();

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalFees).unwrap_or(0);
        if amount <= 0 || amount > total {
            panic!("insufficient fees or invalid amount");
        }

        total = total.saturating_sub(amount);
        env.storage().instance().set(&DataKey::TotalFees, &total);

        let token = Self::fetch_token(env.clone());

        // Transfer funds from Treasury to 'to'
        // Signature: transfer(from, to, amount)
        let args = soroban_sdk::vec![
            &env,
            env.current_contract_address().into_val(&env),
            to.into_val(&env),
            amount.into_val(&env)
        ];
        let _: () = env.invoke_contract(
            &token,
            &Symbol::new(&env, "transfer"),
            args,
        );

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, to.into_val(&env), amount.into_val(&env)];
        env.events().publish((Symbol::new(&env, "fee_withdrawn"),), event_data);
    }

    pub fn total_fees(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalFees).unwrap_or(0)
    }
}
