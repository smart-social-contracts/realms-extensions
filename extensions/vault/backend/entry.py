"""
Vault Extension — Admin treasury dashboard for Realms.

Thin wrapper around ``ic_basilisk_toolkit.wallet.Wallet`` providing:
- Per-token vault balance viewing & live refresh from ledger
- Transaction history (synced from ICRC indexers)
- Ad-hoc admin transfers

All heavy lifting (inter-canister calls, entity storage) is delegated
to ``Wallet``.  The vault extension is a UI-friendly facade.
"""

import json
import traceback

from ic_python_logging import get_logger

logger = get_logger("extensions.vault")

# Lazy singleton — created on first use to avoid module-level toolkit imports
# that can interfere with ic_python_db entity registration order.
_wallet = None


def _get_wallet():
    """Return (or create) the singleton Wallet instance."""
    global _wallet
    if _wallet is None:
        from ic_basilisk_toolkit.wallet import Wallet

        _wallet = Wallet()
    return _wallet


# ------------------------------------------------------------------
# Lifecycle
# ------------------------------------------------------------------


def initialize(args: str):
    """Called once after the extension is loaded.  Registers tokens from
    the ``Token`` entity table into the Wallet (tokens are seeded by
    the post-deploy script)."""
    from ic_basilisk_toolkit.entities import Token

    logger.info("Vault: initializing...")
    wallet = _get_wallet()
    for token in Token.instances():
        wallet.register_token(
            name=token.name,
            ledger=token.ledger,
            indexer=getattr(token, "indexer", "") or "",
            decimals=getattr(token, "decimals", 8) or 8,
            fee=getattr(token, "fee", 10) or 10,
        )
    logger.info(
        f"Vault: tokens registered: {[t['name'] for t in wallet.list_tokens()]}"
    )


def register_entities():
    """No extra entities — Wallet entities (Token, WalletBalance,
    WalletTransfer) are already registered by basilisk OS."""
    pass


# ------------------------------------------------------------------
# Balance (sync — reads cached WalletBalance)
# ------------------------------------------------------------------


def get_vault_balance(args: str) -> str:
    """Return the vault's cached balance for a token (no inter-canister call)."""
    try:
        from basilisk import ic

        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token", "")
        vault_principal = ic.id().to_str()
        wallet = _get_wallet()

        if token:
            amount = wallet.cached_balance(token)
            return _ok(
                {
                    "Balance": {
                        "principal_id": vault_principal,
                        "token": token,
                        "amount": amount,
                    }
                }
            )

        # No token specified → return all token balances
        balances = {}
        for t in wallet.list_tokens():
            balances[t["name"]] = wallet.cached_balance(t["name"])
        return _ok({"Balance": {"principal_id": vault_principal, "balances": balances}})
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Balance (async — queries ledger)
# ------------------------------------------------------------------


def refresh_vault_balance(args: str):
    """Query the ledger for the vault's balance and update local cache."""
    try:
        from basilisk import ic

        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        vault_principal = ic.id().to_str()
        wallet = _get_wallet()

        if token:
            amount = yield wallet.balance_of(token)
            return _ok(
                {
                    "Balance": {
                        "principal_id": vault_principal,
                        "token": token,
                        "amount": amount,
                    }
                }
            )

        # No token specified → refresh all tokens
        balances = {}
        for t in wallet.list_tokens():
            balances[t["name"]] = yield wallet.balance_of(t["name"])
        return _ok({"Balance": {"principal_id": vault_principal, "balances": balances}})
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Transaction history (async — syncs from indexer)
# ------------------------------------------------------------------


def refresh(args: str):
    """Sync recent transactions from indexer canister(s) into local DB."""
    try:
        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        subaccount_hex = params.get("subaccount")
        subaccount = bytes.fromhex(subaccount_hex) if subaccount_hex else None
        wallet = _get_wallet()

        results = {}
        if token:
            results[token] = yield wallet.refresh(token, subaccount=subaccount)
        else:
            for t in wallet.list_tokens():
                results[t["name"]] = yield wallet.refresh(
                    t["name"], subaccount=subaccount
                )

        total_new = sum(r.get("new_txs", 0) for r in results.values())
        return _ok(
            {
                "TransactionSummary": {
                    "new_txs_count": total_new,
                    "per_token": results,
                    "sync_status": "Synced",
                }
            }
        )
    except Exception as e:
        return _err(e)


def get_transactions(args: str) -> str:
    """Return locally cached transaction history (from WalletTransfer entities)."""
    try:
        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        limit = params.get("limit", 50)
        wallet = _get_wallet()

        if token:
            txs = wallet.list_transfers(token, limit=limit)
        else:
            txs = []
            for t in wallet.list_tokens():
                txs.extend(wallet.list_transfers(t["name"], limit=limit))
            txs.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
            txs = txs[:limit]

        return _ok({"Transactions": txs})
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Subaccount management (sync — local DB)
# ------------------------------------------------------------------


def register_subaccount(args: str) -> str:
    """Register a subaccount for balance and transaction tracking."""
    try:
        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        subaccount_hex = params.get("subaccount_hex", "")
        label = params.get("label", "")

        if not token or not subaccount_hex:
            return json.dumps(
                {"success": False, "error": "token and subaccount_hex are required"}
            )

        wallet = _get_wallet()
        sub = wallet.register_subaccount(token, subaccount_hex, label=label)
        return _ok(
            {
                "Subaccount": {
                    "token": token,
                    "subaccount_hex": sub.subaccount_hex,
                    "label": sub.label,
                    "balance": sub.balance,
                }
            }
        )
    except Exception as e:
        return _err(e)


def unregister_subaccount(args: str) -> str:
    """Remove a subaccount from tracking."""
    try:
        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        subaccount_hex = params.get("subaccount_hex", "")

        if not token or not subaccount_hex:
            return json.dumps(
                {"success": False, "error": "token and subaccount_hex are required"}
            )

        wallet = _get_wallet()
        removed = wallet.unregister_subaccount(token, subaccount_hex)
        return _ok({"removed": removed})
    except Exception as e:
        return _err(e)


def list_subaccounts(args: str) -> str:
    """List all registered subaccounts for a token (or all tokens)."""
    try:
        params = json.loads(args) if args and args.strip() else {}
        token = params.get("token")
        wallet = _get_wallet()

        if token:
            subs = wallet.list_subaccounts(token)
            return _ok({"Subaccounts": {token: subs}})

        # All tokens
        all_subs = {}
        for t in wallet.list_tokens():
            subs = wallet.list_subaccounts(t["name"])
            if subs:
                all_subs[t["name"]] = subs
        return _ok({"Subaccounts": all_subs})
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Subaccount lookup (async — queries ledger on the fly)
# ------------------------------------------------------------------


def lookup_balance(args: str):
    """Look up balances for a user's or invoice's subaccount across all tokens.

    Derives the subaccount deterministically from the given principal or
    invoice ID using the ``usr_`` / ``inv_`` prefix convention, then queries
    each token's ledger for the balance.

    Args (JSON):
        principal: Principal ID string → derives ``usr_<principal>`` subaccount
        invoice_id: Invoice ID string → derives ``inv_<invoice_id>`` subaccount
        subaccount_hex: Raw hex subaccount (overrides principal/invoice_id)
    """
    try:
        from ic_basilisk_toolkit.wallet import Wallet as W

        params = json.loads(args) if args and args.strip() else {}
        principal = params.get("principal")
        invoice_id = params.get("invoice_id")
        subaccount_hex = params.get("subaccount_hex")

        if subaccount_hex:
            sub_bytes = bytes.fromhex(subaccount_hex)
            label = subaccount_hex[:16] + "..."
        elif principal:
            sub_bytes = W.user_subaccount(principal)
            subaccount_hex = sub_bytes.hex()
            label = f"usr_{principal}"
        elif invoice_id:
            sub_bytes = W.invoice_subaccount(invoice_id)
            subaccount_hex = sub_bytes.hex()
            label = f"inv_{invoice_id}"
        else:
            return json.dumps(
                {
                    "success": False,
                    "error": "principal, invoice_id, or subaccount_hex required",
                }
            )

        wallet = _get_wallet()
        balances = {}
        for t in wallet.list_tokens():
            bal = yield wallet.balance_of(t["name"], subaccount=sub_bytes)
            balances[t["name"]] = bal

        return _ok(
            {
                "LookupBalance": {
                    "subaccount_hex": subaccount_hex,
                    "label": label,
                    "balances": balances,
                }
            }
        )
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Transfer (async — admin only)
# ------------------------------------------------------------------


def transfer(args: str):
    """Perform an ICRC-1 transfer from the vault (admin only)."""
    try:
        params = json.loads(args) if isinstance(args, str) else args
        to_principal = params.get("to_principal")
        amount = int(params.get("amount"))
        token = params.get("token")
        to_sub = params.get("to_subaccount")
        from_sub = params.get("from_subaccount")

        if not to_principal or amount is None:
            return json.dumps(
                {"success": False, "error": "to_principal and amount are required"}
            )

        wallet = _get_wallet()
        if not token:
            tokens = wallet.list_tokens()
            token = tokens[0]["name"] if tokens else "ckBTC"

        to_subaccount = bytes.fromhex(to_sub) if to_sub else None
        from_subaccount = bytes.fromhex(from_sub) if from_sub else None

        result = yield wallet.transfer(
            token_name=token,
            to_principal=to_principal,
            amount=amount,
            from_subaccount=from_subaccount,
            to_subaccount=to_subaccount,
        )

        if "ok" in result:
            return _ok({"TransactionId": {"transaction_id": int(result["ok"])}})
        elif "err" in result:
            return json.dumps(
                {"success": False, "error": _format_transfer_error(result["err"])}
            )
        else:
            return json.dumps(
                {"success": False, "error": f"Unexpected result: {result}"}
            )
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Status
# ------------------------------------------------------------------


def get_status(args: str) -> str:
    """Return vault status: registered tokens, cached balances, transfer counts."""
    try:
        from basilisk import ic
        from ic_basilisk_toolkit.entities import Token

        wallet = _get_wallet()
        tokens_info = []
        for t in wallet.list_tokens():
            token_obj = Token[t["name"]]
            tx_count = sum(1 for _ in token_obj.transfers) if token_obj else 0
            subs = wallet.list_subaccounts(t["name"])
            sub_balance = sum(s.get("balance", 0) for s in subs)
            default_balance = wallet.cached_balance(t["name"])
            tokens_info.append(
                {
                    "name": t["name"],
                    "ledger": t["ledger"],
                    "indexer": t["indexer"],
                    "cached_balance": default_balance,
                    "aggregate_balance": default_balance + sub_balance,
                    "transfer_count": tx_count,
                    "subaccounts": subs,
                }
            )

        return _ok(
            {
                "Stats": {
                    "vault_principal": ic.id().to_str(),
                    "tokens": tokens_info,
                }
            }
        )
    except Exception as e:
        return _err(e)


def get_balance(args: str) -> str:
    """Get cached balance for a specific principal (reads WalletBalance)."""
    try:
        from basilisk import ic

        params = json.loads(args) if args and args.strip() else {}
        principal_id = params.get("principal_id") or ic.id().to_str()
        token = params.get("token")
        wallet = _get_wallet()

        if token:
            amount = wallet.cached_balance(token, principal=principal_id)
            return _ok(
                {
                    "Balance": {
                        "principal_id": principal_id,
                        "token": token,
                        "amount": amount,
                    }
                }
            )

        balances = {}
        for t in wallet.list_tokens():
            balances[t["name"]] = wallet.cached_balance(
                t["name"], principal=principal_id
            )
        return _ok({"Balance": {"principal_id": principal_id, "balances": balances}})
    except Exception as e:
        return _err(e)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def _ok(data: dict) -> str:
    return json.dumps({"success": True, "data": data})


def _err(exc: Exception) -> str:
    logger.error(f"Vault error: {exc}\n{traceback.format_exc()}")
    return json.dumps({"success": False, "error": str(exc)})


def _format_transfer_error(error_dict: dict) -> str:
    """Format ICRC transfer error into a user-friendly message."""
    if isinstance(error_dict, str):
        return error_dict
    for key, label in [
        ("InsufficientFunds", "Insufficient funds"),
        ("BadFee", "Incorrect fee"),
        ("BadBurn", "Burn amount too low"),
        ("TooOld", "Transaction too old"),
        ("CreatedInFuture", "Timestamp in the future"),
        ("Duplicate", "Duplicate transaction"),
        ("TemporarilyUnavailable", "Ledger temporarily unavailable"),
        ("GenericError", "Transfer error"),
    ]:
        if key in error_dict:
            detail = error_dict[key]
            if isinstance(detail, dict):
                msg = detail.get(
                    "message", detail.get("balance", detail.get("expected_fee", ""))
                )
                return f"{label}: {msg}" if msg else label
            return label
    return f"Transfer failed: {error_dict}"
