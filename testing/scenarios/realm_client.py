#!/usr/bin/env python3
"""
Shared realm client + scenario harness for deployed-realm scenario tests.

This is the single source of truth for talking to a realm over `dfx`, used by
all scenario tests (and intended to be shared with geister). It targets the
real backend entrypoints: `extension_sync_call` for extension functions and
direct methods (e.g. `join_realm`) for the realm backend.

No Docker, no local replica: scenarios run against a realm already deployed on
the `test` network with the TEST_MODE flags enabled.
"""

import json
import os
import subprocess
import uuid

REALM = os.environ.get("REALM_CANISTER_ID", "ku6cv-2iaaa-aaaab-agrpa-cai")
NETWORK = os.environ.get("DFX_NETWORK", "test")

# Deployed test token (kybra-simple-token, test mode). In test mode ANY caller
# may `mint`, so scenarios self-fund throwaway identities without any secret.
TOKEN = os.environ.get("TOKEN_CANISTER_ID", "nusyl-jiaaa-aaaae-qj6mq-cai")

# Self-registration invite-code checksums (sha256 of the role name). With
# test_mode_user_self_registration enabled these grant the role without a real
# invite code (see realm_backend.join_realm).
MEMBER_CODE_CHECKSUM = "e31ab643c44f7a0ec824b59d1194d60dac334200d845e61d2d289daa0f087ea4"
ADMIN_CODE_CHECKSUM = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"

GREEN, RED, BLUE, YELLOW, RESET = (
    "\033[92m", "\033[91m", "\033[94m", "\033[93m", "\033[0m"
)


def _env():
    return dict(os.environ, DFX_WARNING="-mainnet_plaintext_identity")


def _candid(*args):
    """Candid tuple of text literals (JSON escaping == Candid text escaping)."""
    return "(" + ", ".join(json.dumps(a) for a in args) + ")"


def call_backend(method, *text_args, timeout=120):
    """Call a realm_backend method, return parsed JSON output."""
    cmd = [
        "dfx", "canister", "--network", NETWORK, "call", REALM,
        method, _candid(*text_args), "--output", "json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=_env())
    if proc.returncode != 0:
        raise RuntimeError(f"dfx call {method} failed: {proc.stderr.strip()}")
    return json.loads(proc.stdout)


def _unwrap_extension(raw):
    resp = raw.get("response", raw)
    if isinstance(resp, str):
        try:
            resp = json.loads(resp)
        except json.JSONDecodeError:
            pass
    return resp


def call_extension(extension, function, args_obj=None, timeout=120):
    """Call extension_sync_call and unwrap the nested JSON `response` string."""
    raw = call_backend(
        "extension_sync_call", extension, function, json.dumps(args_obj or {}),
        timeout=timeout,
    )
    return _unwrap_extension(raw)


def call_extension_async(extension, function, args_obj=None, timeout=180):
    """Call extension_async_call — required for extension methods that are async
    generators (e.g. anything doing inter-canister ledger/indexer calls)."""
    raw = call_backend(
        "extension_async_call", extension, function, json.dumps(args_obj or {}),
        timeout=timeout,
    )
    return _unwrap_extension(raw)


def call_canister(canister, method, candid_arg="()", query=False, timeout=120):
    """Call an arbitrary canister method with a raw Candid argument string."""
    cmd = [
        "dfx", "canister", "--network", NETWORK, "call", canister,
        method, candid_arg, "--output", "json",
    ]
    if query:
        cmd.append("--query")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, env=_env())
    if proc.returncode != 0:
        raise RuntimeError(f"dfx call {canister}.{method} failed: {proc.stderr.strip()}")
    return json.loads(proc.stdout)


def to_nat(value):
    """Parse a Candid nat from dfx JSON output (e.g. "1_000_500_000" -> int)."""
    return int(str(value).replace("_", "").strip().strip('"'))


# --- test token faucet ------------------------------------------------------


class TestToken:
    """Thin wrapper over the deployed test token (kybra-simple-token).

    `mint` is open to any caller while the token is in test mode, so scenarios
    can fund their own throwaway identities for free — no faucet secret needed.
    """

    def __init__(self, canister=None):
        self.canister = canister or TOKEN

    @staticmethod
    def _account(principal):
        return f'record {{ owner = principal "{principal}"; subaccount = null }}'

    def mint(self, principal, amount):
        arg = f"(record {{ to = {self._account(principal)}; amount = {amount} : nat }})"
        return call_canister(self.canister, "mint", arg)

    def transfer(self, to_principal, amount, fee=None):
        fee_s = "null" if fee is None else f"opt ({fee} : nat)"
        arg = (
            f"(record {{ to = {self._account(to_principal)}; amount = {amount} : nat; "
            f"fee = {fee_s}; memo = null; from_subaccount = null; created_at_time = null }})"
        )
        return call_canister(self.canister, "icrc1_transfer", arg)

    def balance_of(self, principal):
        arg = f"({self._account(principal)})"
        return to_nat(call_canister(self.canister, "icrc1_balance_of", arg, query=True))

    def fee(self):
        return to_nat(call_canister(self.canister, "icrc1_fee", "()", query=True))

    def transactions(self, principal, max_results=20):
        arg = (
            f"(record {{ account = {self._account(principal)}; "
            f"start = null; max_results = {max_results} : nat }})"
        )
        out = call_canister(
            self.canister, "get_account_transactions", arg, query=True
        )
        return out.get("Ok", {}).get("transactions", []) if isinstance(out, dict) else []


def ensure_test_token_in_vault(name="SMPL", canister=None, decimals=8, fee=10_000):
    """Register the test token in the realm's Wallet so the vault tracks it.

    Idempotent (register_token is an upsert). Uses install_codex with run_init
    to execute the registration in-canister. Returns True if the token is listed
    by the vault afterwards.
    """
    ledger = canister or TOKEN
    init_code = (
        "from ic_basilisk_toolkit.wallet import Wallet\n"
        "Wallet().register_token("
        f"name='{name}', ledger='{ledger}', indexer='{ledger}', "
        f"decimals={decimals}, fee={fee})\n"
        f"ic.print('registered {name} test token')\n"
    )
    files = {
        "init.py": init_code,
        "manifest.json": json.dumps({"name": "test_token_setup", "version": "0.0.1"}),
    }
    call_backend(
        "install_codex",
        json.dumps({"codex_id": "test_token_setup", "files": files, "run_init": True}),
        timeout=180,
    )
    status = call_extension("vault", "get_status")
    tokens = status.get("data", {}).get("Stats", {}).get("tokens", [])
    return any(t.get("name") == name for t in tokens)


# --- dfx identity management ------------------------------------------------


def _identity(*args):
    return subprocess.run(
        ["dfx", "identity", *args], capture_output=True, text=True, env=_env()
    )


def whoami():
    return _identity("whoami").stdout.strip()


class TestIdentity:
    """A throwaway dfx identity used as a realm actor, cleaned up on exit.

    Restores the operator's original identity afterwards so a scenario never
    leaves the workstation/CI runner on a different identity.
    """

    def __init__(self, name):
        self.name = name
        self.principal = None
        self._previous = None

    def __enter__(self):
        self._previous = whoami()
        _identity("new", self.name, "--storage-mode", "plaintext")
        _identity("use", self.name)
        self.principal = _identity("get-principal").stdout.strip()
        return self

    def use(self):
        _identity("use", self.name)

    def __exit__(self, *exc):
        if self._previous:
            _identity("use", self._previous)
        _identity("remove", self.name)
        return False


# --- assertion harness ------------------------------------------------------


class Scenario:
    def __init__(self, title):
        self.title = title
        self.failures = []
        self.run_id = f"sc{uuid.uuid4().hex[:8]}"

    def banner(self):
        print(f"{BLUE}=== Scenario: {self.title} ==={RESET}")
        print(f"{YELLOW}RUN_ID={self.run_id}  realm={REALM}  network={NETWORK}{RESET}\n")

    def step(self, msg):
        print(f"{BLUE}>> {msg}{RESET}")

    def check(self, condition, msg):
        if condition:
            print(f"  {GREEN}PASS{RESET} {msg}")
        else:
            print(f"  {RED}FAIL{RESET} {msg}")
            self.failures.append(msg)
        return bool(condition)

    def finish(self):
        print()
        if self.failures:
            print(f"{RED}{len(self.failures)} assertion(s) failed:{RESET}")
            for f in self.failures:
                print(f"  {RED}- {f}{RESET}")
        else:
            print(f"{GREEN}All assertions passed.{RESET}")
        return len(self.failures)
