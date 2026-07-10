#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    VaultAdmin,
    PoolReference,
    SettlementAsset,
    TotalAccruedCommissions,
}

#[contract]
pub struct CommissionVaultContract;

#[contractimpl]
impl CommissionVaultContract {
    pub fn setup_treasury(env: Env, admin: Address, sweepstakes_contract: Address, token: Address) {
        if env.storage().instance().has(&DataKey::VaultAdmin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::VaultAdmin, &admin);
        env.storage().instance().set(&DataKey::PoolReference, &sweepstakes_contract);
        env.storage().instance().set(&DataKey::SettlementAsset, &token);
        env.storage().instance().set(&DataKey::TotalAccruedCommissions, &0i128);
    }

    pub fn get_treasury_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::VaultAdmin)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn get_authorized_pool(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::PoolReference)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn get_settlement_token(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::SettlementAsset)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn record_commission(env: Env, round_id: u32, amount: i128) {
        let authorized_pool = Self::get_authorized_pool(env.clone());
        authorized_pool.require_auth();

        if amount <= 0 {
            panic!("invalid fee amount");
        }

        // Increment total fees
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalAccruedCommissions).unwrap_or(0);
        total = total.saturating_add(amount);
        env.storage().instance().set(&DataKey::TotalAccruedCommissions, &total);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, amount.into_val(&env)];
        env.events().publish((Symbol::new(&env, "commission_received"), round_id), event_data);
    }

    pub fn transfer_funds_out(env: Env, to: Address, amount: i128) {
        let admin = Self::get_treasury_admin(env.clone());
        admin.require_auth();

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalAccruedCommissions).unwrap_or(0);
        if amount <= 0 || amount > total {
            panic!("insufficient fees or invalid amount");
        }

        total = total.saturating_sub(amount);
        env.storage().instance().set(&DataKey::TotalAccruedCommissions, &total);

        let token = Self::get_settlement_token(env.clone());

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
        env.events().publish((Symbol::new(&env, "reserve_disbursed"),), event_data);
    }

    pub fn accumulated_commissions(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalAccruedCommissions).unwrap_or(0)
    }
}
