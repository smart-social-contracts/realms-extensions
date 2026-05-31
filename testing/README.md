# Extension Testing

Tests run against a **deployed** realm on the Internet Computer — no Docker and no
local replica. There are two layers:

1. **Scenario tests** (`testing/scenarios/`) — cross-extension user journeys driven
   over `dfx`. Each scenario is self-provisioning: it creates its own throwaway
   identity and state, so runs never collide and nothing needs pre-seeding.
2. **E2E tests** (`extensions/<name>/tests/e2e/`) — Playwright specs that drive the
   deployed frontend. Run by the `integration-test.yml` workflow.

```
testing/
├── scenarios/
│   ├── realm_client.py                  ← shared dfx client + identity + assertions
│   ├── run_scenarios.sh                 ← discovers & runs all *_scenario.py
│   ├── citizen_onboarding_scenario.py
│   ├── governance_execution_scenario.py
│   ├── token_treasury_scenario.py
│   └── vault_treasury_scenario.py
└── README.md
```

## Target realm

Scenarios run against the **Dominion test** realm, deployed with `TEST_MODE_*`
flags enabled (self-registration, skip-authentication, etc.). The defaults point
there; override via environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `REALM_CANISTER_ID` | `ku6cv-2iaaa-aaaab-agrpa-cai` | Realm backend canister id |
| `DFX_NETWORK` | `ic` | dfx network (the realm lives on `icp0.io`) |
| `TOKEN_CANISTER_ID` | `nusyl-jiaaa-aaaae-qj6mq-cai` | Test token used for value flows |

### Value flows (tokens) — no real assets, no secret

Scenarios that move value use a deployed **test token** (`kybra-simple-token`)
running in test mode. In test mode any caller may `mint`, so a scenario funds its
own throwaway identities for free via `TestToken.mint(...)` — no real ckBTC/ckUSD,
no faucet key, no GitHub secret. Transfers, fees, and the indexer history the vault
relies on are exercised against this token exactly as a real ICRC-1 ledger would be.

## Quick start

```bash
# Run every scenario
bash testing/scenarios/run_scenarios.sh

# Run a subset by name
bash testing/scenarios/run_scenarios.sh citizen_onboarding governance_execution
```

A scenario exits with the number of failed assertions (0 == pass). The runner
aggregates results and exits non-zero if any scenario fails.

## Scenarios

- **citizen_onboarding** — a new member joins the realm, verifies a passport,
  receives the welcome notification, submits a proposal, opens voting, casts a
  vote, and the realm rejects a spoofed voter identity.
- **governance_execution** — an admin submits a proposal carrying inline code,
  approves it, and the test asserts the approved proposal produced a real,
  verifiable side effect (a marker codex) in the realm.
- **token_treasury** — a throwaway identity self-mints test tokens, transfers to
  a second identity, and the test asserts balances reconcile (amount + fee) and
  both the mint and transfer appear in the token indexer history.
- **vault_treasury** — deposits test tokens into the realm's vault (the realm
  treasury), refreshes the vault's on-ledger balance, then withdraws to a throwaway
  recipient via `vault.transfer` (a real inter-canister ICRC-1 transfer). Asserts
  deposit/withdraw deltas reconcile (amount + fee) and the withdrawal is recorded in
  the vault's transaction history. Self-registers the test token in the vault if
  missing, so no manual setup is required.

## Adding a scenario

Create `testing/scenarios/<name>_scenario.py`. It is picked up automatically by
both `run_scenarios.sh` and CI. Use the shared helpers:

```python
import sys
from realm_client import Scenario, TestIdentity, call_backend, call_extension

def run(sc: Scenario):
    with TestIdentity(f"{sc.run_id}_alice") as actor:
        res = call_backend("join_realm")
        sc.check("success" in res, "join_realm succeeded")

def main():
    sc = Scenario("my journey")
    sc.banner()
    try:
        run(sc)
    except Exception as exc:
        sc.check(False, f"scenario raised an exception: {exc}")
    return sc.finish()

if __name__ == "__main__":
    sys.exit(main())
```

## E2E tests

Create `extensions/<name>/tests/e2e/` with `playwright.config.ts`, `package.json`,
and specs. The `integration-test.yml` workflow discovers extensions via the
`tests/e2e/.staging-e2e` marker and runs them against the Dominion frontend.

```bash
export PLAYWRIGHT_BASE_URL=https://gzya5-jyaaa-aaaac-qai5a-cai.icp0.io
cd extensions/<name>/tests/e2e
npm install
npx playwright install chromium
npx playwright test
```

## CI/CD

- **`scenario-tests.yml`** — installs `dfx`, runs `run_scenarios.sh` against the IC
  on every push/PR. Runs are serialized via a concurrency group because they share
  one live realm. No controller secret or wallet is needed (scenarios self-provision
  throwaway identities and call public `TEST_MODE`-enabled methods).
- **`integration-test.yml`** — runs Playwright E2E tests against the deployed
  Dominion frontend.
