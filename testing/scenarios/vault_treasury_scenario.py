#!/usr/bin/env python3
"""
Scenario: vault treasury deposit + withdraw (cross-extension, real ledger calls)

Exercises the vault extension end-to-end against a real (test) token ledger,
proving the vault correctly reflects on-ledger deposits and performs withdrawals
via inter-canister ICRC-1 transfers. No real ckBTC/ckUSD: the deposit is minted
into the test token (test mode), so the scenario is self-funding and free.

All balance checks are deltas because the vault is the shared realm treasury —
absolute balances accumulate across runs, but each run's effect is exact.

Steps:
  1. Ensure the test token is registered in the vault (idempotent).
  2. Read the vault's current on-ledger balance (async refresh) -> B0.
  3. Deposit: mint tokens to the vault principal; assert balance == B0 + deposit.
  4. Withdraw: vault.transfer to a throwaway recipient (admin path, async).
  5. Assert the recipient received exactly the amount on the ledger.
  6. Assert the vault balance dropped by amount + fee, and the withdrawal is
     recorded in the vault's cached transaction history.
"""

import sys

from realm_client import (
    REALM,
    Scenario,
    TestIdentity,
    TestToken,
    call_extension,
    call_extension_async,
    ensure_test_token_in_vault,
)

TOKEN_NAME = "SMPL"


def _vault_balance(token=TOKEN_NAME):
    resp = call_extension_async("vault", "refresh_vault_balance", {"token": token})
    return resp["data"]["Balance"]["amount"]


def run(sc: Scenario):
    token = TestToken()
    fee = token.fee()
    deposit = 2_000_000
    withdraw = 500_000

    sc.step("1. ensure the test token is registered in the vault")
    sc.check(ensure_test_token_in_vault(TOKEN_NAME), f"vault tracks token {TOKEN_NAME}")

    sc.step("2. read vault's current on-ledger balance (async refresh)")
    b0 = _vault_balance()
    sc.check(isinstance(b0, int), f"vault balance readable (B0={b0})")

    sc.step("3. deposit: mint tokens to the vault principal")
    res = token.mint(REALM, deposit)
    sc.check(res.get("success") is True, "mint to vault succeeded")
    b1 = _vault_balance()
    sc.check(b1 == b0 + deposit, f"vault balance rose by deposit (B1={b1}, want {b0 + deposit})")

    with TestIdentity(f"{sc.run_id}_recipient") as recipient:
        to_p = recipient.principal
        print(f"\nwithdraw recipient principal={to_p}")
        before = token.balance_of(to_p)

        sc.step("4. withdraw: vault.transfer to the recipient (admin, async)")
        res = call_extension_async(
            "vault", "transfer",
            {"token": TOKEN_NAME, "to_principal": to_p, "amount": withdraw},
        )
        sc.check(res.get("success") is True, "vault.transfer succeeded")
        tx_id = res.get("data", {}).get("TransactionId", {}).get("transaction_id")
        sc.check(tx_id is not None, f"withdrawal returned a transaction id ({tx_id})")

        sc.step("5. recipient received exactly the withdrawn amount on the ledger")
        after = token.balance_of(to_p)
        sc.check(
            after - before == withdraw,
            f"recipient credited withdraw amount (delta={after - before})",
        )

    sc.step("6. vault balance dropped by amount + fee, and the tx is recorded")
    b2 = _vault_balance()
    sc.check(
        b2 == b1 - withdraw - fee,
        f"vault debited amount+fee (B2={b2}, want {b1 - withdraw - fee})",
    )
    txs = call_extension("vault", "get_transactions", {"token": TOKEN_NAME})
    records = txs.get("data", {}).get("Transactions", [])
    sc.check(
        any(t.get("to") == to_p for t in records),
        "withdrawal recorded in vault transaction history",
    )


def main():
    sc = Scenario("vault treasury deposit + withdraw")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()


if __name__ == "__main__":
    sys.exit(main())
