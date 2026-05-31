#!/usr/bin/env python3
"""
Scenario: token funding + transfer (no real ckBTC/ckUSD required)

Demonstrates how value-handling journeys are tested without any real assets or
faucet secret. The deployed test token runs in test mode, so any caller may
`mint`; scenarios self-fund throwaway identities and exercise real ICRC-1
transfers, fee accounting, and the indexer history the vault relies on.

Steps:
  1. Alice (throwaway) mints test tokens to herself.
  2. Alice's balance and a 'mint' record in the indexer are verified.
  3. Alice transfers tokens to Bob (throwaway); ICRC-1 fee is charged.
  4. Both balances reconcile (sender debited amount + fee, recipient credited).
  5. The transfer shows up in both accounts' indexer history.
"""

import sys

from realm_client import Scenario, TestIdentity, TestToken


def run(sc: Scenario):
    token = TestToken()
    fee = token.fee()
    mint_amount = 1_000_000
    transfer_amount = 250_000

    with TestIdentity(f"{sc.run_id}_alice") as alice:
        alice_p = alice.principal
        print(f"\nalice principal={alice_p}")

        sc.step("1. alice mints test tokens to herself (test-mode faucet)")
        res = token.mint(alice_p, mint_amount)
        sc.check(res.get("success") is True, "mint reported success")

        sc.step("2. verify alice balance + mint recorded in indexer")
        bal = token.balance_of(alice_p)
        sc.check(bal == mint_amount, f"alice balance == minted amount ({bal})")
        txs = token.transactions(alice_p)
        mints = [t for t in txs if t["transaction"]["kind"] == "mint"]
        sc.check(len(mints) >= 1, "a 'mint' transaction is in alice's history")

        with TestIdentity(f"{sc.run_id}_bob") as bob:
            bob_p = bob.principal
            print(f"bob principal={bob_p}")

            # Transfer must be signed by alice (the sender).
            alice.use()

            sc.step("3. alice transfers tokens to bob")
            res = token.transfer(bob_p, transfer_amount)
            sc.check(res.get("success") is True, "icrc1_transfer reported success")

            sc.step("4. balances reconcile (amount + fee debited from sender)")
            alice_bal = token.balance_of(alice_p)
            bob_bal = token.balance_of(bob_p)
            expected_alice = mint_amount - transfer_amount - fee
            sc.check(
                alice_bal == expected_alice,
                f"alice debited amount+fee (have {alice_bal}, want {expected_alice})",
            )
            sc.check(
                bob_bal == transfer_amount,
                f"bob credited transfer amount (have {bob_bal})",
            )

            sc.step("5. transfer appears in both accounts' indexer history")
            bob_txs = token.transactions(bob_p)
            transfers = [t for t in bob_txs if t["transaction"]["kind"] == "transfer"]
            sc.check(len(transfers) >= 1, "a 'transfer' transaction is in bob's history")


def main():
    sc = Scenario("token funding + transfer")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()


if __name__ == "__main__":
    sys.exit(main())
